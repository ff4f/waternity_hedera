// In-memory role mapping by wallet accountId (demo purposes)
const WALLET_ROLES = {
  // Demo Investor Accounts
  '0.0.1234': 'investor',
  '0.0.5678': 'investor',
  '0.0.111111': 'investor',
  '0.0.222222': 'investor',
  
  // Demo Operator Accounts  
  '0.0.1235': 'operator',
  '0.0.1001': 'operator',
  '0.0.333333': 'operator',
  '0.0.444444': 'operator',
  
  // Demo Agent Accounts
  '0.0.1236': 'agent',
  '0.0.2001': 'agent', 
  '0.0.555555': 'agent',
  '0.0.666666': 'agent',
  
  // Demo Admin Accounts
  '0.0.1237': 'admin',
  '0.0.9999': 'admin',
  '0.0.777777': 'admin',
  
  // HashPack Demo Accounts (common testnet accounts)
  '0.0.123456': 'investor',
  '0.0.234567': 'operator', 
  '0.0.345678': 'agent',
  '0.0.456789': 'admin',
};

const DEFAULT_ROLE = 'investor';

const ROLE_CONFIGS = {
  investor: {
    label: 'Investor',
    color: 'bg-emerald-600',
    textColor: 'text-emerald-600',
    icon: 'TrendingUp',
    description: 'Fund water infrastructure'
  },
  operator: {
    label: 'Operator',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    icon: 'Settings',
    description: 'Operate wells & kiosks'
  },
  agent: {
    label: 'Agent',
    color: 'bg-purple-600',
    textColor: 'text-purple-600',
    icon: 'Shield',
    description: 'Audit & compliance'
  },
  admin: {
    label: 'Admin',
    color: 'bg-slate-600',
    textColor: 'text-slate-600',
    icon: 'Crown',
    description: 'System administration'
  },
};

export function getRoleByWallet(accountId) {
  return WALLET_ROLES[accountId] || DEFAULT_ROLE;
}

export function getRoleConfig(role) {
  return ROLE_CONFIGS[role] || ROLE_CONFIGS[DEFAULT_ROLE];
}

export function getRoleBadge(role) {
  const config = getRoleConfig(role);
  return {
    label: config.label,
    color: config.color,
    textColor: config.textColor,
    icon: config.icon,
  };
}

// Permission mapping for role-based access control
const ROLE_PERMISSIONS = {
  investor: ['investment_actions', 'view_projects', 'view_returns'],
  operator: ['project_management', 'milestone_updates', 'view_projects', 'investment_actions'],
  agent: ['milestone_verification', 'valve_control', 'audit_anchoring', 'view_projects'],
  admin: ['*'] // Admin has all permissions
};

export function canAccess(accountId, userRole, permission) {
  // If no accountId provided, deny access
  if (!accountId) return false;
  
  // Get role from wallet if userRole not provided
  const role = userRole || getRoleByWallet(accountId);
  
  // Get permissions for the role
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  // Admin has all permissions
  if (permissions.includes('*')) return true;
  
  // Check if role has the specific permission
  return permissions.includes(permission);
}

// Legacy function for hierarchy-based access (kept for backward compatibility)
export function canAccessByHierarchy(userRole, requiredRole) {
  const hierarchy = { admin: 4, agent: 3, operator: 2, investor: 1 };
  return (hierarchy[userRole] || 0) >= (hierarchy[requiredRole] || 0);
}

export function filterTabsByRole(userRole, tabs) {
  // Filter tabs based on role permissions
  return tabs.filter(tab => {
    if (!tab.requireRole) return true;
    return canAccess(userRole, tab.requireRole);
  });
}