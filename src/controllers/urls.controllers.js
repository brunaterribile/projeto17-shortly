import connectionDB from "../database/db.js";
import { nanoid } from "nanoid";

export async function shortener(req, res){
    const { authorization } = req.headers;
    const token = authorization?.replace("Bearer ", "");

    const { url } = req.body;
    const shortUrl = nanoid(10);

    if(!token) {
        return res.sendStatus(401);
    }

    try {
        const session = await connectionDB.query(`
            SELECT * FROM sessions WHERE token = $1`, [token]);
        if(session.rowCount == 0){
            return res.sendStatus(401)
        }
        
        const userId = session.rows[0].id  

        const addUrl = await connectionDB.query(`
            INSERT INTO urls (url, "userId", "shortUrl", "visitCount")
            VALUES ($1, $2, $3, $4)`, 
            [url, userId, shortUrl, 0]);

        res.status(201).send({shortUrl})
    } catch (err){
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function getUrl(req, res){
    const id = req.params.id

    try {
        const urlExist = await connectionDB.query(`
            SELECT id, "shortUrl", url 
            FROM urls WHERE id = $1`, [id]);
        if(urlExist.rowCount == 0){
            return res.sendStatus(404)
        }

        res.status(200).send(urlExist.rows[0])
    } catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function goToUrl(req, res){
    const shortUrl = req.params.shortUrl

    try {
        const findUrl = await connectionDB.query(`
            SELECT id, url, "visitCount" 
            FROM urls WHERE "shortUrl" = $1`, [shortUrl]);
        if(findUrl.rowCount == 0){
            return res.sendStatus(404)
        }

        const urlData = findUrl.rows[0]
        const visitCount = (urlData.visitCount) + 1

        const addVisit = await connectionDB.query(`
            UPDATE urls 
            SET "visitCount" = $1
            WHERE id = $2`, 
            [visitCount, urlData.id]);

        res.redirect(urlData.url)
    } catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
}

export async function deleteUrl(req, res){

}