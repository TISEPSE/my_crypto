const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany()
    console.log('Users in PostgreSQL:', users.length)
    console.log('Users:', users.map(u => ({ id: u.id, email: u.email, username: u.username })))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()