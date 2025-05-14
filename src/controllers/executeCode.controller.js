import { db } from "../libs/db.js";
import {
  getLanguageName,
  pollBatchResults,
  submitBatch,
} from "../libs/judge0.lib.js";

export const executeCode = async (req, res) => {
  try {
    const { source_code, language_id, stdin, expected_outputs, problemId } =
      req.body;

    const userId = req.user.id; // userId from authMiddleware

    // validate the test cases

    if (
      !Array.isArray(stdin) ||
      stdin.length === 0 ||
      !Array.isArray(expected_outputs) ||
      expected_outputs.length !== stdin.length
    ) {
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

    const tokens = submitResponse.map((res) => res.token); // Extract tokens from the response

    // 4. Poll judge0 for results of all submitted test cases
    const results = await pollBatchResults(tokens);

    // console.log("Results------------: ", results);

    // 5.  Analyze test case results
    let allPassed = true;

    const detailedResults = results.map((result, i) => {
      const stdout = result.stdout?.trim();
      const expected_output = expected_outputs[i]?.trim();
      const passed = stdout === expected_output;

      if (!passed) {
        allPassed = false;
      }

      return {
        testCase: i + 1,
        passed,
        stdout,
        expected: expected_output,
        stderr: result.stderr || null,
        compile_output: result.compile_output || null,
        status: result.status.description,
        memory: result.memory ? `${result.memory} KB` : undefined,
        time: result.time ? `${result.time} s` : undefined,
      };
    });

    // console.log("Detailed Results: ", detailedResults);

    // 6. store submission summary
    const submission = await db.submission.create({
    data: {
        user: {
        connect: { id: userId },
        },
        problem: {
        connect: { id: problemId },
        },
        language: getLanguageName(language_id),
        sourceCode: source_code,
        stdin: stdin.join("\n"),
        stdout: JSON.stringify(detailedResults.map((res) => res.stdout)),
        stderr: detailedResults.some((res) => res.stderr)
        ? JSON.stringify(detailedResults.map((res) => res.stderr))
        : null,
        compileOutput: detailedResults.some((res) => res.compile_output)
        ? JSON.stringify(detailedResults.map((res) => res.compile_output))
        : null,
        status: allPassed ? "Accepted" : "Wrong Answer",
        time: detailedResults.some((res) => res.time)
        ? JSON.stringify(detailedResults.map((res) => res.time))
        : null,
        memory: detailedResults.some((res) => res.memory)
        ? JSON.stringify(detailedResults.map((res) => res.memory))
        : null,
    },
    });



    // 7. if all passed = true, then mark the problem as solved for the current user
    if (allPassed) {
      await db.problemSolved.upsert({
        // upsert will create a new record if it doesn't exist or update the existing one
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
        update: {},
        create: {
          userId,
          problemId,
        },
      });
    }

    // 8. save the individual test case results using detailedResults
    const testCaseResults = detailedResults.map((result) => ({
      submissionId: submission.id,
      testCase: result.testCase,
      passed: result.passed,
      stdout: result.stdout,
      expected: result.expected,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      status: result.status,
      memory: result.memory,
      time: result.time,
    }));

    await db.testCaseResult.createMany({
      data: testCaseResults,
    });

    const submissionWithTestCase = await db.submission.findUnique({
      where: {
        id: submission.id,
      },
      include: {
        testCases: true,
      },
    });

    // send the response back to the client
    res.status(200).json({
      message: "Code executed successfully",
      submission: submissionWithTestCase,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error while executing code" });
  }
};
