import { Metadata } from 'next'
import Link from 'next/link'
import DocumentAnchorForm from '@/components/forms/DocumentAnchorForm'
import SettlementWizard from '@/components/settlement/SettlementWizard'
import { getStatusColor } from '@/lib/ui'

export const metadata: Metadata = {
  title: 'Agent Interface - Waternity',
  description: 'Data verification and validation interface for field agents',
}

// Mock data for agent dashboard
const mockAgentData = {
  agentId: 'agent-001',
  agentName: 'Sarah Agent',
  assignedWells: 5,
  pendingVerifications: 8,
  completedToday: 3,
  totalVerifications: 127,
  verificationTasks: [
    {
      id: '1',
      wellId: '1',
      wellCode: 'WTR-001',
      wellName: 'Sunrise Valley Well',
      taskType: 'PRODUCTION_VERIFICATION',
      title: 'Verify Monthly Production Data',
      description: 'Verify reported production of 4,750 kWh for January 2024',
      priority: 'high',
      dueDate: new Date('2024-01-25'),
      submittedBy: 'John Operator',
      submittedAt: new Date('2024-01-20T09:30:00Z'),
      status: 'pending',
      documents: ['production-report-jan-2024.pdf', 'meter-readings.xlsx'],
      location: 'Lagos, Nigeria'
    },
    {
      id: '2',
      wellId: '2',
      wellCode: 'WTR-002',
      taskType: 'MAINTENANCE_VERIFICATION',
      title: 'Verify Maintenance Completion',
      description: 'Verify quarterly maintenance and equipment inspection',
      priority: 'medium',
      dueDate: new Date('2024-01-28'),
      submittedBy: 'Mike Supervisor',
      submittedAt: new Date('2024-01-19T14:15:00Z'),
      status: 'pending',
      documents: ['maintenance-checklist.pdf', 'equipment-photos.zip'],
      location: 'Abuja, Nigeria'
    },
    {
      id: '3',
      wellId: '3',
      wellCode: 'WTR-003',
      taskType: 'DOCUMENT_VERIFICATION',
      title: 'Verify Permit Documentation',
      description: 'Verify updated environmental compliance certificates',
      priority: 'low',
      dueDate: new Date('2024-02-01'),
      submittedBy: 'Lisa Manager',
      submittedAt: new Date('2024-01-18T11:45:00Z'),
      status: 'pending',
      documents: ['env-permit-2024.pdf', 'compliance-report.pdf'],
      location: 'Kano, Nigeria'
    }
  ],
  recentVerifications: [
    {
      id: '1',
      wellCode: 'WTR-001',
      taskType: 'MILESTONE_VERIFICATION',
      title: 'Production Milestone Verified',
      result: 'approved',
      verifiedAt: new Date('2024-01-20T16:30:00Z'),
      txId: '0.0.12345@1705766200.123456789'
    },
    {
      id: '2',
      wellCode: 'WTR-002',
      taskType: 'MAINTENANCE_VERIFICATION',
      title: 'Maintenance Report Verified',
      result: 'approved',
      verifiedAt: new Date('2024-01-19T13:20:00Z'),
      txId: '0.0.12345@1705668000.987654321'
    },
    {
      id: '3',
      wellCode: 'WTR-004',
      taskType: 'DOCUMENT_VERIFICATION',
      title: 'Permit Documentation Rejected',
      result: 'rejected',
      reason: 'Missing environmental impact assessment',
      verifiedAt: new Date('2024-01-18T10:15:00Z'),
      txId: '0.0.12345@1705575300.456789123'
    }
  ]
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTaskTypeColor(taskType: string): string {
  switch (taskType) {
    case 'PRODUCTION_VERIFICATION':
      return 'bg-blue-100 text-blue-800'
    case 'MAINTENANCE_VERIFICATION':
      return 'bg-purple-100 text-purple-800'
    case 'DOCUMENT_VERIFICATION':
      return 'bg-indigo-100 text-indigo-800'
    case 'MILESTONE_VERIFICATION':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getResultColor(result: string): string {
  return getStatusColor(result)
}

function getDaysUntilDue(dueDate: Date): number {
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export default function AgentPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Interface</h1>
            <p className="text-gray-600">
              Verify and validate water well data submissions on Hedera
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary">
              View Guidelines
            </button>
            <button className="btn-primary">
              Submit Verification
            </button>
          </div>
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Assigned Wells</p>
              <p className="text-2xl font-semibold text-gray-900">{mockAgentData.assignedWells}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
              <p className="text-2xl font-semibold text-gray-900">{mockAgentData.pendingVerifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-900">{mockAgentData.completedToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Verifications</p>
              <p className="text-2xl font-semibold text-gray-900">{mockAgentData.totalVerifications}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Anchor Form */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-card p-6">
          <DocumentAnchorForm wellId="1" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Tasks */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Verifications</h2>
              <div className="flex items-center space-x-2">
                <select className="text-sm border-gray-300 rounded-md">
                  <option>All Types</option>
                  <option>Production</option>
                  <option>Maintenance</option>
                  <option>Documents</option>
                </select>
                <select className="text-sm border-gray-300 rounded-md">
                  <option>All Priority</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {mockAgentData.verificationTasks.map((task) => {
                const daysUntilDue = getDaysUntilDue(task.dueDate)
                const isOverdue = daysUntilDue < 0
                const isUrgent = daysUntilDue <= 2 && daysUntilDue >= 0
                
                return (
                  <div key={task.id} className={`border rounded-lg p-4 ${
                    isOverdue ? 'border-red-300 bg-red-50' : 
                    isUrgent ? 'border-yellow-300 bg-yellow-50' : 
                    'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskTypeColor(task.taskType)}`}>
                            {task.taskType.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500">{task.wellCode}</span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>📍 {task.location}</span>
                          <span>👤 {task.submittedBy}</span>
                          <span>📅 {formatDateTime(task.submittedAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className={`text-xs font-medium ${
                          isOverdue ? 'text-red-600' : 
                          isUrgent ? 'text-yellow-600' : 
                          'text-gray-500'
                        }`}>
                          {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                           isUrgent ? `${daysUntilDue} days left` :
                           `Due ${formatDate(task.dueDate)}`}
                        </div>
                        <button className="btn-primary text-xs px-3 py-1">
                          Review
                        </button>
                      </div>
                    </div>
                    
                    {task.documents && task.documents.length > 0 && (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-xs text-gray-500 mb-2">Documents to review:</p>
                        <div className="flex flex-wrap gap-2">
                          {task.documents.map((doc, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              📄 {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                Load More Tasks →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Verifications */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Verifications</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockAgentData.recentVerifications.map((verification) => (
                <div key={verification.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(verification.taskType)}`}>
                          {verification.taskType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">{verification.wellCode}</span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{verification.title}</h4>
                      <p className="text-xs text-gray-500">{formatDateTime(verification.verifiedAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getResultColor(verification.result)}`}>
                      {verification.result.toUpperCase()}
                    </span>
                  </div>
                  
                  {verification.reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      <strong>Reason:</strong> {verification.reason}
                    </div>
                  )}
                  
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <a 
                      href={`https://hashscan.io/testnet/transaction/${verification.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      View Transaction →
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All Verifications →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Guidelines */}
      <div className="mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Verification Guidelines</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• <strong>Production Verification:</strong> Cross-check meter readings with historical data and validate against capacity limits.</p>
                <p>• <strong>Maintenance Verification:</strong> Ensure all checklist items are completed and photographic evidence is provided.</p>
                <p>• <strong>Document Verification:</strong> Verify authenticity, completeness, and compliance with regulatory requirements.</p>
                <p>• <strong>Timeline:</strong> Complete high-priority verifications within 24 hours, medium within 48 hours, low within 72 hours.</p>
              </div>
              <div className="mt-4">
                <Link href="/agent/guidelines" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  View Complete Guidelines →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}