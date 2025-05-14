import axios from 'axios';

export const getJudge0LanguageId = (language) => {
    const normalized = language.toLowerCase();
    const aliasMap = {
        "python": "python3",
        "py": "python3",
        "js": "javascript",
        "nodejs": "javascript",
    };

    const finalLang = aliasMap[normalized] || normalized;

    const languageMap = {
        "python3": 71,
        "java": 62,
        "javascript": 63,
    };

    return languageMap[finalLang] || null;
}



const sleep= (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const pollBatchResults = async (tokens) => {
    while (true) {
        const {data} = await axios.get(`${process.env.JUDGE0_API_URL}/submissions/batch`, {
            params: {
                tokens: tokens.join(','),
                base64_encoded: false,
            }
        })

        const results = data.submissions; // [{status, stdout, stderr, token}, {status, stdout, stderr, token}, ...]
        // console.log("Polling results: ", results);

        const allCompleted = results.every(result => result.status.id !== 1 && result.status.id !== 2); // Check if all submissions are completed

        if (allCompleted) return results; // Return the results when all submissions are completed
        await sleep(1000); // Wait for 2 seconds before polling again
    }
}


export const submitBatch = async (submissions)=>{
    
    // console.log("Submissions: ", submissions) // [{source_code, language_id, stdin}, {source_code, language_id, stdin}, ...]

    // const {data} = await axios.post(`${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,{
    const {data} = await axios.post(`${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`, {
        submissions
    })

    // console.log("Submission Results: ", data)

    return data // [{token} , {token} , {token}]
}

export const getLanguageName = (languageId) => {
    const LANGUAGE_NAMES = {
        71: "Python",
        62: "Java",
        63: "JavaScript",
    }

    return LANGUAGE_NAMES[languageId] || "Unknown Language";
}