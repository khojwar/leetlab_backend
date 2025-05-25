import { db } from "../libs/db.js"
import { getJudge0LanguageId, pollBatchResults, submitBatch } from "../libs/judge0.lib.js";


export const createProblem = async (req, res) => {
    
    // get the data from the request body
    // check if the user is admin
    // loop through each reference solution for different languages
    //       // get judge0 language id for the current language
    //       // prepare the judge0 submission for all the test cases
    //      // submit all the test cases in one batch to judge0  --> judge0 return the token
    //      // extract the token from response
    //      // poll judge0 untill all the test cases are completed
    //      // validate that each test cases is passed (status.id === 3)
    // save the problem in the database after all validation passed

    const { title, description, difficulty, tags, input, output, constraints, examples, testCases, codeSnippets, referenceSolutions } = req.body; 
    

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "You are not authorized to create a problem" });
    }

    try {
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {   // Object.entries(referenceSolutions) --> converts the object into an array of key-value pairs     

            // get judge0 language id for the current language
            const languageId = getJudge0LanguageId(language.toLowerCase());
            // const languageId = getJudge0LanguageId(language);
            
            if (!languageId) {
                return res.status(400).json({ message: `Invalid language: ${language}` });
            }

            // prepare the judge0 submission for all the test cases
            const submissions = testCases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }));


            // submit all the test cases in one batch to judge0
            const submissionResults = await submitBatch(submissions);

            // console.log(`Submission results for ${language}:`, submissionResults); // debugging purpose
            

            // Extract the tokens from the response
            const tokens = submissionResults.map((res) => res.token); 

            // poll judge0 untill all the test cases are completed
            const results = await pollBatchResults(tokens); // Poll the results using the tokens   --> asking judge0 endpint again and again until we get the final result
            

            // validate that each test cases is passed (status.id === 3)
            for (let i=0; i < results.length; i++) {
                const result = results[i];

                // debugging purpose
                console.log(`------------------------- Test case ${i + 1} for language ${language}:`, result); 
                
                
                if  (result.status.id !== 3) { 
                    return res.status(400).json({ error: `Test case ${i + 1} failed for language ${language}` });
                }
            }
        }

        // save the problem in the database
        const newProblem = await db.problem.create({
            data: { 
                title, 
                description, 
                difficulty, 
                tags, 
                constraints, 
                examples, 
                testCases, 
                codeSnippets, 
                referenceSolutions, 
                userId: req.user.id 
            }
        });

        return res.status(201).json({ message: "Problem created successfully", newProblem });       

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error while creating problem" }); 
    }
}

export const getAllProblems = async (req, res) => {
    try {
        const problems = await db.problem.findMany({
            include: {
                solvedBy: {
                    where: {
                        userId: req.user.id
                    }
                }
            }
        });
        

        if (!problems) {
            return res.status(404).json({ message: "No problems found" });
        }
        

        return res.status(200).json({ 
            success: true,
            message: "Problems fetched successfully", 
            problems 
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error while fetching problems" });
    }

}

export const getProblemById = async (req, res) => {
    try {

        const { id } = req.params;
    
        const problem = await db.problem.findUnique({
            where: {
                id,
            },
        });

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        return res.status(200).json({ 
            success: true,
            message: "Problem fetched successfully", 
            problem 
        });  
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error while fetching problem" });
        
    }
}

// TODO: check in postman
export const updateProblemById = async (req, res) => {
       const { title, description, difficulty, tags, input, output, constraints, examples, testCases, codeSnippets, referenceSolutions } = req.body; 
    

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "You are not authorized to create a problem" });
    }
    
    try {
        
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {   // Object.entries(referenceSolutions) --> converts the object into an array of key-value pairs     

            // get judge0 language id for the current language
            const languageId = getJudge0LanguageId(language.toLowerCase());
            // const languageId = getJudge0LanguageId(language);
            
            if (!languageId) {
                return res.status(400).json({ message: `Invalid language: ${language}` });
            }

            // prepare the judge0 submission for all the test cases
            const submissions = testCases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }));


            // submit all the test cases in one batch to judge0
            const submissionResults = await submitBatch(submissions);

            // console.log(`Submission results for ${language}:`, submissionResults); // debugging purpose
            

            // Extract the tokens from the response
            const tokens = submissionResults.map((res) => res.token); 

            // poll judge0 untill all the test cases are completed
            const results = await pollBatchResults(tokens); // Poll the results using the tokens   --> asking judge0 endpint again and again until we get the final result
            

            // validate that each test cases is passed (status.id === 3)
            for (let i=0; i < results.length; i++) {
                const result = results[i];

                // debugging purpose
                console.log(`------------------------- Test case ${i + 1} for language ${language}:`, result); 
                
                
                if  (result.status.id !== 3) { 
                    return res.status(400).json({ error: `Test case ${i + 1} failed for language ${language}` });
                }
            }
        }

        // update the problem in the database
        const { id } = req.params;

        const updatedProblem = await db.problem.update({
            where: {
                id,
            },
            data: { 
                title, 
                description, 
                difficulty, 
                tags, 
                constraints, 
                examples, 
                testCases, 
                codeSnippets, 
                referenceSolutions, 
            }
        });

        if (!updatedProblem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        return res.status(200).json({ 
            success: true,
            message: "Problem updated successfully", 
            updatedProblem 
        });

        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error while updating problem" });
        
    }
}

export const deleteProblemById = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProblem = await db.problem.delete({
            where: {
                id,
            },
        });

        if (!deletedProblem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        return res.status(200).json({ 
            success: true,
            message: "Problem deleted successfully", 
            deletedProblem 
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error while deleting problem" });
    }
}

export const getAllProblemsSolvedByUser = async (req, res) => {
    try {
        // get solved problems from currently logged in user 

        const problems = await db.problem.findMany({
            where: {
                solvedBy: {
                    some: {
                        id: req.user.id
                    },
                }
            },
            include: {      // it gives the details of the user who solved the problem. otherwise it will only give the user id
                solvedBy: {
                    userId: req.user.id
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Problems fetched successfully",
            problems
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error while fetching problems solved by user" }); 
    }
}