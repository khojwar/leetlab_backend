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