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

interface SearchResult {
    videoId: string;
    title: string;
    artist: string;
}

app.get('/search', async (req: Request, res: Response) => {

    if (!req.query.title) {
        res.status(400).send('Query parameter \'title=<yourSongTitle>\' is missing.');
        return;
    }

    const query = req.query.title as string;
    const search = await yt.music.search(query, { type: 'song' });
    if (search.songs.contents.length == 0) {
        res.status(404).send('No songs found');
        return;
    }

    let listOfSearchResults: SearchResult[] = [];
    search.songs.contents.forEach(song => {
        if (song.id && song.title) {
            listOfSearchResults.push({
                videoId: song.id,
                title: song.title,
                artist: getArtistName(song)
            });
        }
    });

    res.json(listOfSearchResults);
});

app.use((req: Request, res: Response) => {
    res.status(404).send('Theres nothing here. Try /search');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


function getArtistName(song: {
    author?: { name?: string } | null;
    authors?: { name?: string }[] | null;
    artists?: { name?: string }[] | null;
}): string {
    if (song.author?.name) return song.author.name;
    if (song.authors?.length && song.authors[0]?.name) return song.authors[0].name;
    if (song.artists?.length && song.artists[0]?.name) return song.artists[0].name;
    return "Unknown Artist";
}