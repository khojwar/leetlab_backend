write models in `prisma/schema.prisma` file:

    eg. 
    model User {
        id       String   @id @default(uuid())
        name     String?
        email    String?  @unique
        .
        .
        .
    }




After creating models, run following cmd:

    npx prisma generate   
    npx prisma migrate dev
    npx prisma db push 

    npm run dev 

