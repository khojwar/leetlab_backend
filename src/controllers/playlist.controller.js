import { db } from "../libs/db.js"

export const getAllPlaylistDetails = async (req, res) => {
    try {

        const playlist = await db.playlist.findMany({
            where: {
                id: req.user.id
            },
            include: {
                problems: {
                    include: {
                        problem: true
                    }
                }
            }
        })

        if (submissions.length === 0) {
            return res.status(404).json({ message: "No playlist found" });
        }

        res.status(200).json({
            success: true,
            message: "Successfully fetched playlist",
            playlist: playlist
        })
        
    } catch (error) {
        console.error("Fetch playlist error", error)
        res.status(500).json({
            error: "Falied to fetch playlist"
        })
    }
}

export const getPlaylistDetails = async (req, res) => {
    try {

        const playlistId = req.params.id;
        const userId = req.user.id;

        const playlist = await db.playlist.findUnique({
            where: {
                id: playlistId,
                userId
            },
            include: {
                problems: {
                    include: {
                        problem: true
                    }
                }
            }
        })

        if (!playlist) {
            return res.status(404).json({
                error: "playlist not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "playlist fetched successfully",
            playlist
        })
        
    } catch (error) {
        console.log("Fetch playlist error", error);
        res.status(500).json({
            error: "Internal Server Error"
        })
    }
}

export const createPlaylist = async (req, res) => {
    try {

        const {title, description} = req.body;

        const userId = req.user.id;

        const playlist = await db.playlist.create({
            data: {
                title,
                description,
                userId
            }
        })

        res.status(200).json({
            success: true,
            message: "playlist created successfully",
            playlist
        })


        
    } catch (error) {
        console.error("Error creating playlist", error)
        res.status(500).json({
            error: "Failed to create playlist",
        })
    }
}

export const addProblemToPlaylist = async (req, res) => {
    try {

        const playlistId = req.params.playlistId;
        const {problemIds} = req.body;

        if (!Array.isArray(problemIds) || problemIds.length === 0) {
            return res.status(400).json({
                error: "Invalid or missing problemIds"
            })
        }

        const problemsInPlaylist = await db.problemsInPlaylist.createMany({
            data: problemIds.map((problemId) => {
                problemId,
                playlistId
            })
        })

        res.status(200).json({
            success: true,
            message: "Problems added to playlist successfully",
            problemsInPlaylist
        })
        
    } catch (error) {
        console.error("Error adding problem in playlist", error);
        res.status(500).json({
            error: "Error adding problem in playlist"
        })
    }
}

export const deletePlaylist = async (req, res ) => {
    try {
            const playlistId = req.params;
        
            const playlist = await db.playlist.delete({
                where: {
                    id: playlistId
                }
            })
        
            res.status(200).json({
                success: true,
                message: "playlist deleted successfylly",
                playlist
            })
    } catch (error) {
        console.error("Error creating deleting playlist", error)
        res.status(500).json({
            error: "Failed to delete playlist"
        })
    }
}

export const removeProblemFromPlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { problemIds } = req.body;

        if (!Array.isArray(problemIds) || problemIds.length === 0) {
            return res.status(400).json({ error: "Invalid or missing problemsId" });
        }

        const deletedProblem = await db.problemsInPlaylist.deleteMany({
            where: {
                playlistId,
                problemId: {
                    in: problemIds
                }
            }
        })

        res.status(200).json({
            success: true,
            message: "Problem removed from playlist successfully",
            deletedProblem,
        });

        
    } catch (error) {
        console.error("Error removing problem from playlist", error)
        res.status(500).json({ error: "Failed to remove problem from playlist" });
    }
}