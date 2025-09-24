import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAgent } from '@/lib/auth/roles';
import { Role } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require AGENT role for agent data access
    const authCheck = await requireAgent(request);
    if (authCheck) {
      return authCheck; // Return error response if auth failed
    }
    
    const agentId = params.id;

    // Get agent data
    const agent = await prisma.user.findUnique({
      where: { 
        id: agentId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get wells that need verification
    const wells = await prisma.well.findMany({
      include: {
        operator: {
          select: {
            name: true
          }
        }
      },
      take: 10
    });

    // Mock verification tasks based on wells
    const verificationTasks = wells.map((well, index) => ({
      id: `task_${well.id}_${index}`,
      wellId: well.id,
      wellCode: well.code,
      wellName: well.name,
      location: well.location,
      operatorName: well.operator?.name || 'Unknown Operator',
      operatorId: well.operator?.name || 'unknown',
      priority: 'High',
      estimatedTime: '2-3 hours',
      description: getTaskDescription('water_quality_verification'),
      waterQuality: null,
      recentEvents: []
    }));

    // Mock disputes data
    const disputes = wells.length > 0 ? [
      {
        id: 'dispute_1',
        wellCode: wells[0].code,
        wellName: wells[0].name,
        disputeType: 'WATER_QUALITY_DISPUTE',
        status: 'OPEN',
        priority: 'HIGH',
        submittedBy: 'Investor John Doe',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Water quality test results seem inconsistent with previous measurements',
        evidence: ['photo_1.jpg', 'test_results.pdf'],
        assignedAgent: agent.name || 'Agent',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ] : [];

    // Calculate agent statistics
    const totalTasks = verificationTasks.length;
    const completedTasks = Math.floor(totalTasks * 0.3);
    const pendingTasks = Math.floor(totalTasks * 0.6);
    const inProgressTasks = Math.floor(totalTasks * 0.1);
    const disputedTasks = disputes.length;
    
    const totalEarnings = completedTasks * 50;

    const agentData = {
      id: agent.id,
      name: agent.name || 'Agent',
      username: agent.username,
      walletEvm: agent.walletEvm,
      createdAt: agent.createdAt,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        disputedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalEarnings,
        averageTaskTime: 135,
        rating: 4.8
      },
      verificationTasks: verificationTasks.slice(0, 20),
      disputes: disputes,
      upcomingDeadlines: verificationTasks.slice(0, 5).map(task => ({
        taskId: task.id,
        wellName: task.wellName,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: task.priority,
        estimatedDuration: task.estimatedTime
      }))
    };

    return NextResponse.json(agentData);
  } catch (error) {
    console.error('Error fetching agent data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent data' },
      { status: 500 }
    );
  }
}

function getTaskDescription(taskType: string): string {
  const descriptions = {
    water_quality_verification: 'Verify water quality parameters and ensure compliance with safety standards',
    maintenance_inspection: 'Conduct routine maintenance inspection and report any issues',
    equipment_calibration: 'Calibrate monitoring equipment and sensors',
    safety_audit: 'Perform safety audit and compliance check'
  };
  
  return descriptions[taskType as keyof typeof descriptions] || 'General verification task';
}