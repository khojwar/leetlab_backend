import { db } from "../libs/db.js";

export const getAllSubmission = async (req, res) => {
    try {
        const userId = req.usser.id;

        const submissions = await db.submission.findMany({
            where: {
                userId: userId
            }
        })

        if (submissions.length === 0) {
            return res.status(404).json({ message: "No submissions found" });
        }

        res.status(200).json({
            success: true,
            message: "Submissions fetched successfully",
            submissions: submissions
        })

        
    } catch (error) {
        console.error("Fetch submissions error:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
}

export const getSubmissionsForProblem = async (req, res) => {
    try {

        const problemId = req.params.problemId;
        const userId = req.user.id;

        const submissions = await db.submission.findMany({
            where: {
                problemId: problemId,
                userId: userId
            }
        })

        res.status(200).json({
            success: true,
            message: "Submissions fetched successfully",
            submissions: submissions
        });
        
    } catch (error) {
       console.error("Fetch submissions error:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
}

export const getAllTheSubmissionsForProblem = async (req, res) => {
    const problemId = req.params.problemId;

    try {
        const submission = await db.submission.count({
            where: {
                problemId: problemId
            }
        })
        
        res.status(200).json({
            success: true,
            message: "Submissions fetched successfully",
            count: submission
        });

    } catch (error) {
        console.error("Fetch submissions error:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
        
    }
}