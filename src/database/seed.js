const { User, Group, GroupMember } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('vuongvuive123', 12);
    const admin = await User.createUser({
      email: 'ngthnhvuong@gmail.com',
      name: 'Thanh Vương',
      password: adminPassword,
      status: 'ACTIVE'
    });

    console.log('✅ Admin user created:', admin.email);

    // Create admin group
    const adminGroup = await Group.createGroup({
      name: 'Admin Group',
      slug: 'admin-group',
      color: '#EF4444'
    }, admin.id);

    console.log('✅ Admin group created:', adminGroup.name);

    // Add admin to group
    await GroupMember.addMember(adminGroup.id, admin.id, 'ADMIN');

    console.log('✅ Admin added to group');

    // Create sample project
    const project = {
      id: require('crypto').randomUUID(),
      name: 'Sample Project',
      description: 'A sample project for testing',
      status: 'ACTIVE',
      groupId: adminGroup.id,
      createdBy: admin.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = require('../config/database');
    await db.query(`
      INSERT INTO projects (id, name, description, status, groupId, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      project.id,
      project.name,
      project.description,
      project.status,
      project.groupId,
      project.createdBy,
      project.createdAt,
      project.updatedAt
    ]);

    console.log('✅ Sample project created:', project.name);

    // Create sample task
    const task = {
      id: require('crypto').randomUUID(),
      title: 'Sample Task',
      description: 'A sample task for testing',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id,
      creatorId: admin.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.query(`
      INSERT INTO tasks (id, title, description, status, priority, projectId, creatorId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.projectId,
      task.creatorId,
      task.createdAt,
      task.updatedAt
    ]);

    console.log('✅ Sample task created:', task.title);

    console.log('🎉 Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seed failed:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed };