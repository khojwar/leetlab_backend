import { pollBatchResults, submitBatch } from "../libs/judge0.lib.js";

export const executeCode = async (req, res) => {
    try {
        const { source_code, language_id, stdin, expected_outputs, problemId } = req.body;
        
        const { userId } = req.user;        // userId from authMiddleware

        // validate the test cases

        if (!Array.isArray(stdin) || stdin.length === 0 || !Array.isArray(expected_outputs) || expected_outputs.length !== stdin.length) {
            return res.status(400).json({ error: "Invalid or missing test cases" });
        }

        // 2. Prepare each test case for judge0 batch submission
        const submissions = stdin.map((input, index) => ({
            source_code,
            language_id,
            stdin: input,
        }));

        // 3. Send the batch submission request to judge0
        const submitResponse = await submitBatch(submissions);


        const tokens = submitResponse.map(res => res.token); // Extract tokens from the response

        // 4. Poll judge0 for results of all submitted test cases
        const results = await pollBatchResults(tokens);

        console.log("Results------------: ", results);

        res.status(200).json({
            message: "Code executed successfully",
        });
        




    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error while executing code" });
        
    }
}