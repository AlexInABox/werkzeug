import { Innertube, UniversalCache } from 'youtubei.js';
import express, { Request, Response } from "express";
import { rateLimit } from 'express-rate-limit'


const yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

const app = express();
app.use(limiter);

app.get('/search', async (req: Request, res: Response) => {

    if (!req.query.title) {
        res.status(400).send('Query parameter \'title=<yourSongTitle>\' is missing.');
        return;
    }

    const query = req.query.title as string;
    const search = await yt.music.search(query, { type: 'song' });
    if (!search.songs.title) {
        res.status(404).send('No songs found');
        return;
    }
    const songIds = search.songs.contents.map(song => song.id);
    res.json(songIds);
});

app.use((req: Request, res: Response) => {
    res.status(404).send('Theres nothing here. Try /search');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});