// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title WaterManagement
 * @dev Smart contract for transparent water resource management
 * Handles water allocation, usage tracking, and payment processing
 */
contract WaterManagement is Ownable, ReentrancyGuard {

    // Events
    event WellRegistered(uint256 indexed wellId, address indexed operator, string location);
    event WaterAllocated(uint256 indexed wellId, address indexed user, uint256 amount, uint256 price);
    event WaterUsed(uint256 indexed wellId, address indexed user, uint256 amount, uint256 timestamp);
    event PaymentProcessed(uint256 indexed wellId, address indexed user, uint256 amount, address token);
    event QualityDataSubmitted(uint256 indexed wellId, string dataHash, uint256 timestamp);
    event ConservationRewardIssued(address indexed user, uint256 amount, string reason);

    // Structs
    struct Well {
        uint256 id;
        address operator;
        string location;
        string name;
        uint256 totalCapacity; // in liters
        uint256 availableCapacity;
        uint256 pricePerLiter; // in wei
        bool isActive;
        string hcsTopicId;
        uint256 createdAt;
    }

    struct WaterAllocation {
        uint256 wellId;
        address user;
        uint256 allocatedAmount;
        uint256 usedAmount;
        uint256 pricePerLiter;
        uint256 expiresAt;
        bool isActive;
    }

    struct QualityData {
        uint256 wellId;
        string dataHash; // IPFS or HFS hash
        uint256 ph; // pH * 100 (to handle decimals)
        uint256 turbidity; // NTU * 100
        uint256 temperature; // Celsius * 100
        uint256 timestamp;
        address submittedBy;
    }

    struct ConservationMetrics {
        uint256 totalSaved; // liters saved
        uint256 rewardsEarned; // tokens earned
        uint256 lastRewardTime;
        uint256 conservationScore; // 0-1000
    }

    // State variables
    mapping(uint256 => Well) public wells;
    mapping(bytes32 => WaterAllocation) public allocations; // keccak256(wellId, user)
    mapping(uint256 => QualityData[]) public qualityHistory;
    mapping(address => ConservationMetrics) public conservationData;
    mapping(address => bool) public authorizedOperators;
    
    uint256 public nextWellId = 1;
    uint256 public totalWellsRegistered;
    uint256 public totalWaterAllocated;
    uint256 public totalConservationRewards;
    
    IERC20 public paymentToken; // HTS token for payments
    IERC20 public rewardToken; // HTS token for conservation rewards
    
    uint256 public constant CONSERVATION_REWARD_RATE = 1e15; // 0.001 tokens per liter saved
    uint256 public constant QUALITY_SUBMISSION_REWARD = 1e16; // 0.01 tokens per quality submission

    constructor(
        address _paymentToken,
        address _rewardToken
    ) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        rewardToken = IERC20(_rewardToken);
    }

    // Modifiers
    modifier onlyAuthorizedOperator() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized operator");
        _;
    }

    modifier validWell(uint256 _wellId) {
        require(_wellId > 0 && _wellId < nextWellId, "Invalid well ID");
        require(wells[_wellId].isActive, "Well is not active");
        _;
    }

    // Well Management Functions
    
    /**
     * @dev Register a new water well
     */
    function registerWell(
        string memory _location,
        string memory _name,
        uint256 _totalCapacity,
        uint256 _pricePerLiter,
        string memory _hcsTopicId
    ) external onlyAuthorizedOperator returns (uint256) {
        require(_totalCapacity > 0, "Capacity must be greater than 0");
        require(_pricePerLiter > 0, "Price must be greater than 0");
        
        uint256 wellId = nextWellId++;
        
        wells[wellId] = Well({
            id: wellId,
            operator: msg.sender,
            location: _location,
            name: _name,
            totalCapacity: _totalCapacity,
            availableCapacity: _totalCapacity,
            pricePerLiter: _pricePerLiter,
            isActive: true,
            hcsTopicId: _hcsTopicId,
            createdAt: block.timestamp
        });
        
        totalWellsRegistered++;
        
        emit WellRegistered(wellId, msg.sender, _location);
        return wellId;
    }

    /**
     * @dev Update well capacity and pricing
     */
    function updateWell(
        uint256 _wellId,
        uint256 _totalCapacity,
        uint256 _pricePerLiter
    ) external validWell(_wellId) {
        Well storage well = wells[_wellId];
        require(msg.sender == well.operator || msg.sender == owner(), "Not authorized");
        
        well.totalCapacity = _totalCapacity;
        well.pricePerLiter = _pricePerLiter;
        
        // Adjust available capacity if needed
        if (well.availableCapacity > _totalCapacity) {
            well.availableCapacity = _totalCapacity;
        }
    }

    // Water Allocation Functions
    
    /**
     * @dev Allocate water to a user
     */
    function allocateWater(
        uint256 _wellId,
        address _user,
        uint256 _amount,
        uint256 _durationDays
    ) external validWell(_wellId) nonReentrant {
        Well storage well = wells[_wellId];
        require(msg.sender == well.operator || msg.sender == owner(), "Not authorized");
        require(_amount <= well.availableCapacity, "Insufficient capacity");
        require(_user != address(0), "Invalid user address");
        
        bytes32 allocationKey = keccak256(abi.encodePacked(_wellId, _user));
        
        // Check if user already has active allocation
        if (allocations[allocationKey].isActive) {
            require(block.timestamp > allocations[allocationKey].expiresAt, "Active allocation exists");
        }
        
        uint256 totalCost = _amount * well.pricePerLiter;
        require(paymentToken.transferFrom(_user, address(this), totalCost), "Payment failed");
        
        allocations[allocationKey] = WaterAllocation({
            wellId: _wellId,
            user: _user,
            allocatedAmount: _amount,
            usedAmount: 0,
            pricePerLiter: well.pricePerLiter,
            expiresAt: block.timestamp + (_durationDays * 1 days),
            isActive: true
        });
        
        well.availableCapacity = well.availableCapacity - _amount;
        totalWaterAllocated = totalWaterAllocated + _amount;
        
        emit WaterAllocated(_wellId, _user, _amount, well.pricePerLiter);
        emit PaymentProcessed(_wellId, _user, totalCost, address(paymentToken));
    }

    /**
     * @dev Record water usage
     */
    function recordWaterUsage(
        uint256 _wellId,
        address _user,
        uint256 _amount
    ) external validWell(_wellId) {
        Well storage well = wells[_wellId];
        require(msg.sender == well.operator || msg.sender == owner(), "Not authorized");
        
        bytes32 allocationKey = keccak256(abi.encodePacked(_wellId, _user));
        WaterAllocation storage allocation = allocations[allocationKey];
        
        require(allocation.isActive, "No active allocation");
        require(block.timestamp <= allocation.expiresAt, "Allocation expired");
        require(allocation.usedAmount + _amount <= allocation.allocatedAmount, "Exceeds allocation");
        
        allocation.usedAmount = allocation.usedAmount + _amount;
        
        emit WaterUsed(_wellId, _user, _amount, block.timestamp);
    }

    // Quality Management Functions
    
    /**
     * @dev Submit water quality data
     */
    function submitQualityData(
        uint256 _wellId,
        string memory _dataHash,
        uint256 _ph,
        uint256 _turbidity,
        uint256 _temperature
    ) external validWell(_wellId) {
        Well storage well = wells[_wellId];
        require(msg.sender == well.operator || authorizedOperators[msg.sender], "Not authorized");
        
        QualityData memory newData = QualityData({
            wellId: _wellId,
            dataHash: _dataHash,
            ph: _ph,
            turbidity: _turbidity,
            temperature: _temperature,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });
        
        qualityHistory[_wellId].push(newData);
        
        // Reward for quality data submission
        if (rewardToken.balanceOf(address(this)) >= QUALITY_SUBMISSION_REWARD) {
            rewardToken.transfer(msg.sender, QUALITY_SUBMISSION_REWARD);
        }
        
        emit QualityDataSubmitted(_wellId, _dataHash, block.timestamp);
    }

    // Conservation Functions
    
    /**
     * @dev Record conservation achievement and issue rewards
     */
    function recordConservation(
        address _user,
        uint256 _waterSaved,
        string memory _reason
    ) external onlyAuthorizedOperator {
        require(_user != address(0), "Invalid user address");
        require(_waterSaved > 0, "Water saved must be greater than 0");
        
        ConservationMetrics storage metrics = conservationData[_user];
        metrics.totalSaved = metrics.totalSaved + _waterSaved;
        metrics.lastRewardTime = block.timestamp;
        
        // Calculate conservation score (0-1000)
        metrics.conservationScore = calculateConservationScore(metrics.totalSaved);
        
        // Calculate and issue rewards
        uint256 rewardAmount = _waterSaved * CONSERVATION_REWARD_RATE;
        
        if (rewardToken.balanceOf(address(this)) >= rewardAmount) {
            rewardToken.transfer(_user, rewardAmount);
            metrics.rewardsEarned = metrics.rewardsEarned + rewardAmount;
            totalConservationRewards = totalConservationRewards + rewardAmount;
            
            emit ConservationRewardIssued(_user, rewardAmount, _reason);
        }
    }

    // View Functions
    
    /**
     * @dev Get well information
     */
    function getWell(uint256 _wellId) external view returns (
        uint256 id,
        address operator,
        string memory location,
        string memory name,
        uint256 totalCapacity,
        uint256 availableCapacity,
        uint256 pricePerLiter,
        bool isActive,
        string memory hcsTopicId
    ) {
        Well storage well = wells[_wellId];
        return (
            well.id,
            well.operator,
            well.location,
            well.name,
            well.totalCapacity,
            well.availableCapacity,
            well.pricePerLiter,
            well.isActive,
            well.hcsTopicId
        );
    }

    /**
     * @dev Get user's water allocation
     */
    function getUserAllocation(uint256 _wellId, address _user) external view returns (
        uint256 allocatedAmount,
        uint256 usedAmount,
        uint256 remainingAmount,
        uint256 expiresAt,
        bool isActive
    ) {
        bytes32 allocationKey = keccak256(abi.encodePacked(_wellId, _user));
        WaterAllocation storage allocation = allocations[allocationKey];
        
        return (
            allocation.allocatedAmount,
            allocation.usedAmount,
            allocation.allocatedAmount - allocation.usedAmount,
            allocation.expiresAt,
            allocation.isActive && block.timestamp <= allocation.expiresAt
        );
    }

    /**
     * @dev Get quality data history for a well
     */
    function getQualityHistory(uint256 _wellId, uint256 _limit) external view returns (
        QualityData[] memory
    ) {
        QualityData[] storage history = qualityHistory[_wellId];
        uint256 length = history.length;
        
        if (_limit == 0 || _limit > length) {
            _limit = length;
        }
        
        QualityData[] memory result = new QualityData[](_limit);
        
        for (uint256 i = 0; i < _limit; i++) {
            result[i] = history[length - 1 - i]; // Return most recent first
        }
        
        return result;
    }

    /**
     * @dev Get user's conservation metrics
     */
    function getConservationMetrics(address _user) external view returns (
        uint256 totalSaved,
        uint256 rewardsEarned,
        uint256 lastRewardTime,
        uint256 conservationScore
    ) {
        ConservationMetrics storage metrics = conservationData[_user];
        return (
            metrics.totalSaved,
            metrics.rewardsEarned,
            metrics.lastRewardTime,
            metrics.conservationScore
        );
    }

    // Admin Functions
    
    /**
     * @dev Add authorized operator
     */
    function addOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = true;
    }

    /**
     * @dev Remove authorized operator
     */
    function removeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = false;
    }

    /**
     * @dev Deactivate a well
     */
    function deactivateWell(uint256 _wellId) external validWell(_wellId) {
        Well storage well = wells[_wellId];
        require(msg.sender == well.operator || msg.sender == owner(), "Not authorized");
        well.isActive = false;
    }

    /**
     * @dev Emergency withdrawal of tokens
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }

    // Internal Functions
    
    /**
     * @dev Calculate conservation score based on total water saved
     */
    function calculateConservationScore(uint256 _totalSaved) internal pure returns (uint256) {
        // Score calculation: 1 point per 100 liters saved, max 1000
        uint256 score = _totalSaved / 100;
        return score > 1000 ? 1000 : score;
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalWells,
        uint256 totalAllocated,
        uint256 totalRewards,
        uint256 contractBalance
    ) {
        return (
            totalWellsRegistered,
            totalWaterAllocated,
            totalConservationRewards,
            paymentToken.balanceOf(address(this))
        );
    }
}