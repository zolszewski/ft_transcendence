import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter })

async function main() {


  const result = await prisma.User.create({ 
     data: {
       name: "Bob",
       email: "bob@gmail.com",
       password: "bobpass",
     articles : {
       create: [
         {
           title: "ok",
           content: "nobody",
         },
       {
           title: "ok2",
           content: "else",
       },
     ],
   },
   
  },
    include: {
    articles: true,
   },
});
  console.table(result);}


main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })