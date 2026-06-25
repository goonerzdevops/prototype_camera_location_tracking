import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Memulai Seeding Database...')

  // 1. Create Initial Admin User
  const adminPassword = await bcrypt.hash('findo2026', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword, email: 'admin@prototype.com' },
    create: {
      username: 'admin',
      email: 'admin@prototype.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`[+] Admin User: ${admin.username} (Password: findo2026)`)

  // 2. Create Initial Regular User
  const userPassword = await bcrypt.hash('findo2026', 10)
  const user = await prisma.user.upsert({
    where: { username: 'user1' },
    update: { password: userPassword, email: 'user@prototype.com' },
    create: {
      username: 'user1',
      email: 'user@prototype.com',
      password: userPassword,
      role: 'USER',
    },
  })
  console.log(`[+] Regular User: ${user.username} (Password: findo2026)`)

  // 3. Create Master Data: Camera Types
  const cameraTypes = ['Camera Phone', 'Camera Tablet', 'DSLR', 'Drone Camera']
  for (const name of cameraTypes) {
    const existing = await prisma.cameraType.findFirst({ where: { name } })
    if (!existing) {
      await prisma.cameraType.create({ data: { name } })
    }
  }
  console.log(`[+] Master Data: Camera Types berhasil dimasukkan.`)

  // 4. Create Master Data: Locations
  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Denpasar', 'Semarang']
  for (const name of locations) {
    const existing = await prisma.location.findFirst({ where: { name } })
    if (!existing) {
      await prisma.location.create({ data: { name } })
    }
  }
  console.log(`[+] Master Data: Locations berhasil dimasukkan.`)

  console.log('Seeding Selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
