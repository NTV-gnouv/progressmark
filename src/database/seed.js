const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('vuongvuive123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'ngthnhvuong@gmail.com' },
      update: {},
      create: {
        email: 'ngthnhvuong@gmail.com',
        name: 'Thanh Vương',
        password: adminPassword,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin user created:', admin.email);

    // Create admin group
    const adminGroup = await prisma.group.upsert({
      where: { slug: 'admin-group' },
      update: {},
      create: {
        name: 'Admin Group',
        slug: 'admin-group',
        color: '#EF4444',
        createdBy: admin.id
      }
    });

    // Add admin as owner of admin group
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: adminGroup.id,
          userId: admin.id
        }
      },
      update: {},
      create: {
        groupId: adminGroup.id,
        userId: admin.id,
        role: 'OWNER'
      }
    });

    console.log('✅ Admin group created and admin added as owner');

    // Create demo user
    const demoPassword = await bcrypt.hash('demo123', 12);
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@progressmark.com' },
      update: {},
      create: {
        email: 'demo@progressmark.com',
        name: 'Demo User',
        password: demoPassword,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Demo user created:', demoUser.email);

    // Create demo group
    const demoGroup = await prisma.group.upsert({
      where: { slug: 'demo-group' },
      update: {},
      create: {
        name: 'Demo Group',
        slug: 'demo-group',
        color: '#3B82F6',
        createdBy: demoUser.id
      }
    });

    console.log('✅ Demo group created:', demoGroup.name);

    // Add demo user as owner of demo group
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: demoGroup.id,
          userId: demoUser.id
        }
      },
      update: {},
      create: {
        groupId: demoGroup.id,
        userId: demoUser.id,
        role: 'OWNER'
      }
    });

    console.log('✅ Demo user added as group owner');

    // Create demo team
    const demoTeam = await prisma.team.create({
      data: {
        groupId: demoGroup.id,
        name: 'Development Team',
        description: 'Main development team',
        createdBy: demoUser.id
      }
    });

    console.log('✅ Demo team created:', demoTeam.name);

    // Add demo user to team
    await prisma.teamMember.create({
      data: {
        teamId: demoTeam.id,
        userId: demoUser.id,
        role: 'LEAD'
      }
    });

    console.log('✅ Demo user added to team');

    // Create demo project
    const demoProject = await prisma.project.create({
      data: {
        groupId: demoGroup.id,
        teamId: demoTeam.id,
        name: 'Demo Project',
        code: 'DEMO',
        description: 'A demonstration project',
        status: 'ACTIVE',
        createdBy: demoUser.id
      }
    });

    console.log('✅ Demo project created:', demoProject.name);

    // Add demo user to project
    await prisma.projectMember.create({
      data: {
        projectId: demoProject.id,
        userId: demoUser.id,
        role: 'PM'
      }
    });

    console.log('✅ Demo user added to project');

    // Create demo tasks
    const tasks = [
      {
        title: 'Setup project structure',
        description: 'Initialize the project with proper folder structure and configuration',
        priority: 'HIGH',
        status: 'DONE',
        estimateHours: 4
      },
      {
        title: 'Implement authentication',
        description: 'Create user registration, login, and JWT token management',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        estimateHours: 8
      },
      {
        title: 'Create task management',
        description: 'Build CRUD operations for tasks with proper validation',
        priority: 'MEDIUM',
        status: 'TODO',
        estimateHours: 12
      },
      {
        title: 'Add AI evaluation',
        description: 'Integrate AI service for automatic task evaluation',
        priority: 'LOW',
        status: 'BACKLOG',
        estimateHours: 16
      }
    ];

    for (const taskData of tasks) {
      const task = await prisma.task.create({
        data: {
          projectId: demoProject.id,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          estimateHours: taskData.estimateHours,
          createdBy: demoUser.id
        }
      });

      // Add demo user as assignee
      await prisma.taskAssignee.create({
        data: {
          taskId: task.id,
          userId: demoUser.id
        }
      });

      console.log('✅ Demo task created:', task.title);
    }

    // Create demo plan
    const demoPlan = await prisma.plan.create({
      data: {
        name: 'Starter Plan',
        orderIndex: 1,
        durationDays: 30,
        priceAmount: 29.99,
        priceCurrency: 'USD',
        description: 'Perfect for small teams getting started',
        isVisible: true,
        isFeatured: true,
        themeColor: '#10B981',
        highlights: ['Up to 5 team members', '10 projects', 'Basic AI evaluation']
      }
    });

    console.log('✅ Demo plan created:', demoPlan.name);

    // Create demo features
    const features = [
      { code: 'max_members', name: 'Maximum Members', description: 'Maximum number of team members' },
      { code: 'max_projects', name: 'Maximum Projects', description: 'Maximum number of projects' },
      { code: 'max_teams', name: 'Maximum Teams', description: 'Maximum number of teams' },
      { code: 'max_storage_mb', name: 'Storage Limit', description: 'Maximum storage in MB' },
      { code: 'max_ai_runs_month', name: 'AI Runs per Month', description: 'Maximum AI evaluations per month' }
    ];

    for (const featureData of features) {
      await prisma.feature.upsert({
        where: { code: featureData.code },
        update: {},
        create: featureData
      });
    }

    console.log('✅ Demo features created');

    // Create plan features
    const planFeatures = [
      { featureCode: 'max_members', value: 5 },
      { featureCode: 'max_projects', value: 10 },
      { featureCode: 'max_teams', value: 3 },
      { featureCode: 'max_storage_mb', value: 1024 },
      { featureCode: 'max_ai_runs_month', value: 100 }
    ];

    for (const planFeatureData of planFeatures) {
      await prisma.planFeature.create({
        data: {
          planId: demoPlan.id,
          featureCode: planFeatureData.featureCode,
          value: planFeatureData.value
        }
      });
    }

    console.log('✅ Demo plan features created');

    console.log('🎉 Database seed completed successfully!');
    console.log('\n📋 Demo credentials:');
    console.log('Admin: admin@progressmark.com / admin123');
    console.log('Demo: demo@progressmark.com / demo123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
