![alt text](diagram_lyst1745252581414.png)


    cd backend
    npm init --y

Update `package.json`

    {
    "name": "backend",
    "version": "1.0.0",
    "main": "src/index.js",
    "type": "module",
    "scripts": {
        "dev": "nodemon src/index.js"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "description": ""
    }


Install

    npm i -g nodemon

    npm i express

    npm i dotenv


`src/index.js`

    import express from 'express';
    import dotenv from 'dotenv';

    dotenv.config();

    const app = express();


    const port = process.env.PORT || 8080;

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });


Now, run the code

    npm run dev



----
Prisma
----

    npm i prisma  
    npm i @prisma/client
    npx prisma init   --> it provide configuration


Docker image

    docker run --name leetlab -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mypassword -p 5432:5432 -d postgres


`prisma/schema.prisma`

    enum UserRole {
    USER
    ADMIN
    }


    model User {
    id        String   @id @default(uuid())
    name      String?
    email     String?  @unique
    image     String?
    role      UserRole @default(USER)
    password  String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    }

Run cmd

    npx prisma generate


`src/libs/db.js`

    import {PrismaClient} from '../generated/prisma/index.js'

    const globalForPrisma = globalThis;

    export const db = globalForPrisma.prisma || new PrismaClient()


    if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db
    }


Run cmd

    npx prisma migrate dev

    npx prisma db push

To checking either express is run or not

    npm run dev


Add parser in `src/index.js`

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

Adding auth routes in `src/index.js`

    import authRoutes from './routes/auth.routes.js';

    app.use("api/v1/auth", authRoutes);



auth router `src/routers/auth.routes.js`

    import express from 'express';
    import { register, login, logout, check } from '../controllers/auth.controller.js';
    import { authMiddleware } from '../middleware/auth.middleware.js';

    const authRoutes = express.Router();

    authRoutes.post("/register", register)
    authRoutes.post("/login", login)
    authRoutes.post("/logout", authMiddleware, logout)
    authRoutes.get("/check", authMiddleware, check)

    export default authRoutes;

cmd

    npm i bcryptjs
    npm i jsonwebtoken cookie-parser


To generate secret key (jwk secret key), use following command,

    openssl rand -hex 32


auth controller `src/controllers/auth.controller.js`

    import bcrypt from "bcryptjs";
    import {db} from "../libs/db.js";
    import {UserRole} from "../generated/prisma/index.js";
    import jwt from "jsonwebtoken";

    export const register = async (req, res) => {
        const {email, password, name} = req.body;

        // console.log("Registering user: ", email, password, name);
        

        try {
            const existingUser = await db.user.findUnique({
                where: {
                    email
                }
            })

            if (existingUser) {
                return res.status(400).json({message: "User already exists"})
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await db.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: UserRole.USER
                }
            })

            // console.log("New user created: ", newUser);
            
            // console.log(process.env.JWT_SECRET);
            

            const token = jwt.sign({id: newUser.id}, process.env.JWT_SECRET, {
                expiresIn: "7d"}) 

                // console.log("Token: ", token);
                

            
            res.cookie("jwt", token, {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV !== "development",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            })


            res.status(201).json({
                success: true,
                message: "User created successfully",
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    image: newUser.image,
                }
                
            })

        } catch (error) {
            console.error("Eror creating user: ", error);

            res.status(500).json({message: "Error creating user"})
        }
    }

    export const login = async (req, res) => {
    try {
            const {email, password} = req.body;
        
            const user = await db.user.findUnique({
                where: {
                    email
                }
            })
        
            if (!user) {
                return res.status(401).json({message: "Invalid credentials"})
            }
        
            const isPasswordValid = await bcrypt.compare(password, user.password)
        
            if (!isPasswordValid) {
                return res.status(401).json({message: "Invalid credentials"})
            }

            const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {
                expiresIn: "7d"})
            
            res.cookie("jwt", token, {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV !== "development",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            })

            res.status(200).json({
                success: true,
                message: "User logged in successfully",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.image,
                }
            })


    } catch (error) {
            console.error("Error logging in user: ", error);
            
            return res.status(500).json({message: "Error logging in user"})
        }
        
    }

    export const logout = async (req, res) => {
        try {
            res.clearCookie("jwt", {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV !== "development",
            })

            res.status(200).json({
                success: true,
                message: "User logged out successfully"
            })

        } catch (error) {
            console.error("Error logging out user: ", error);
            
            return res.status(500).json({message: "Error logging out user"})
        }
    }

    export const check = async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                message: "User is logged in",
                user: req.user
            })

            
        } catch (error) {
            console.error("Error checking user: ", error);
            
            return res.status(500).json({message: "Error checking user"})
            
        }
    }



isLoggedInUser `middleware/auth.middleware.js`

    import jwt from "jsonwebtoken";
    import { db } from "../libs/db.js";

    export const authMiddleware = async (req, res, next) => {
        try {

            const token = req.cookies.jwt;
            
            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            let decoded;

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)

                const user = await db.user.findUnique({
                    where: {
                        id: decoded.id
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        image: true
                    }
                });

                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                req.user = user;
                next();

            } catch (error) {
                return res.status(401).json({ message: "Invalid token" });
            }
            
        } catch (error) {
            console.error("Error in auth middleware: ", error);
            return res.status(500).json({ message: "Error in auth middleware" });
            
        }
    }




### judbe0 installation steps:

    https://chetanrakheja.hashnode.dev/install-judge0-macos

### sulu.sh

    alternative of judge0


----

### create-problem controller Steps

    * Extract problem details (like title, description, testcases, etc.) from req.body.
    * Check if the logged-in user is an admin (req.user.role !== "ADMIN").
        * If not, respond with 403 Forbidden.
    * Inside a try block:
        * Loop through each language and its corresponding reference solution in referenceSolutions:
            * Convert the language (like "python", "cpp") to a Judge0 languageId using getJudge0LanguageId(language).
            * If the language is invalid, return a 400 Bad Request with an appropriate message.
            * For each test case:
                * Prepare a submission object with solutionCode, language_id, stdin, and expected_output.
            * Submit all test cases using submitBatch(), which returns tokens.
            * Extract all tokens from the submission results.
            * Use pollBatchResults(tokens) to keep checking for final results from Judge0.
            * Loop through each result:
                * If the status is not 3 (which means “Accepted”), return a 400 with the test case failure info.
        * If all test cases pass:
            * Save the new problem to the database using db.problem.create() with all provided fields.
            * Return a 201 Created response with a success message and the created problem.
    * If any error occurs in the try block, it's caught (though the catch block is currently empty).


`src/libs/judge0.lib.js`

    import axios from "axios"

    export const getJudge0LanguageId = (language)=>{
        const languageMap = {
            "PYTHON":71,
            "JAVA":62,
            "JAVASCRIPT":63,
        }

        return languageMap[language.toUpperCase()]
    }

    const sleep  = (ms)=> new Promise((resolve)=> setTimeout(resolve , ms))

    export const pollBatchResults = async (tokens)=>{
        while(true){
            
            const {data} = await axios.get(`${process.env.JUDGE0_API_URL}/submissions/batch`,{
                params:{
                    tokens:tokens.join(","),
                    base64_encoded:false,
                }
            })

            const results = data.submissions;

            const isAllDone = results.every(
                (r)=> r.status.id !== 1 && r.status.id !== 2
            )

            if(isAllDone) return results
            await sleep(1000)
        }
    }

    export const submitBatch = async (submissions)=>{
        const {data} = await axios.post(`${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,{
            submissions
        })


        console.log("Submission Results: ", data)

        return data // [{token} , {token} , {token}]
    }


    export function getLanguageName(languageId){
        const LANGUAGE_NAMES = {
            74: "TypeScript",
            63: "JavaScript",
            71: "Python",
            62: "Java",
        }

        return LANGUAGE_NAMES[languageId] || "Unknown"
    }



`src/controllers/problem.controller.js`

    import { db } from "../libs/db.js";
    import {
    getJudge0LanguageId,
    pollBatchResults,
    submitBatch,
    } from "../libs/judge0.lib.js";

    export const createProblem = async (req, res) => {
    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippets,
        referenceSolutions,
    } = req.body;

    // going to check the user role once again

    try {
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
        const languageId = getJudge0LanguageId(language);

        if (!languageId) {
            return res
            .status(400)
            .json({ error: `Language ${language} is not supported` });
        }

        //
        const submissions = testcases.map(({ input, output }) => ({
            source_code: solutionCode,
            language_id: languageId,
            stdin: input,
            expected_output: output,
        }));

        const submissionResults = await submitBatch(submissions);

        const tokens = submissionResults.map((res) => res.token);

        const results = await pollBatchResults(tokens);

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            console.log("Result-----", result);
            // console.log(
            //   `Testcase ${i + 1} and Language ${language} ----- result ${JSON.stringify(result.status.description)}`
            // );
            if (result.status.id !== 3) {
            return res.status(400).json({
                error: `Testcase ${i + 1} failed for language ${language}`,
            });
            }
        }
        }

        const newProblem = await db.problem.create({
        data: {
            title,
            description,
            difficulty,
            tags,
            examples,
            constraints,
            testcases,
            codeSnippets,
            referenceSolutions,
            userId: req.user.id,
        },
        });

        return res.status(201).json({
        sucess: true,
        message: "Message Created Successfully",
        problem: newProblem,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        error: "Error While Creating Problem",
        });
    }
    };

    export const getAllProblems = async (req, res) => {
    try {
        const problems = await db.problem.findMany();

        if (!problems) {
        return res.status(404).json({
            error: "No problems Found",
        });
        }

        res.status(200).json({
        sucess: true,
        message: "Message Fetched Successfully",
        problems,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        error: "Error While Fetching Problems",
        });
    }
    };

    export const getProblemById = async (req, res) => {
    const { id } = req.params;

    try {
        const problem = await db.problem.findUnique({
        where: {
            id,
        },
        });

        if (!problem) {
        return res.status(404).json({ error: "Problem not found." });
        }

        return res.status(200).json({
        sucess: true,
        message: "Message Created Successfully",
        problem,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        error: "Error While Fetching Problem by id",
        });
    }
    };

    // TODO: IMPLEMENT BY YOUR SELF🔥
    export const updateProblem = async (req, res) => {
    // id
    // id--->problem ( condition)
    // baaki kaam same as create
    };

    export const deleteProblem = async (req, res) => {
    const { id } = req.params;

    try {
        const problem = await db.problem.findUnique({ where: { id } });

        if (!problem) {
        return res.status(404).json({ error: "Problem Not found" });
        }

        await db.problem.delete({ where: { id } });

        res.status(200).json({
        success: true,
        message: "Problem deleted Successfully",
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
        error: "Error While deleting the problem",
        });
    }
    };

    export const getAllProblemsSolvedByUser = async (req, res) => {
    try {
        const problems = await db.problem.findMany({
        where:{
            solvedBy:{
            some:{
                userId:req.user.id
            }
            }
        },
        include:{
            solvedBy:{
            where:{
                userId:req.user.id
            }
            }
        }
        })

        res.status(200).json({
        success:true,
        message:"Problems fetched successfully",
        problems
        })
    } catch (error) {
        console.error("Error fetching problems :" , error);
        res.status(500).json({error:"Failed to fetch problems"})
    }
    };



### To run judge0 in docker, run following code

    install wsl for windows

    open `cmd` prompt and type `wsl`

    cd judge0-v1.13.1
    docker-compose up -d db redis
    sleep 10s
    docker-compose up -d
    sleep 5s

## judge0 documenation link

https://github.com/judge0/judge0/blob/master/CHANGELOG.md








