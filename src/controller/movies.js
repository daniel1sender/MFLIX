import express from 'express';
import movieService from '../service/MovieService.js';
import { validateBody, validateParam } from '../utils/validator.js';
import { schemas } from '../validation/schemas.js';
import { auth } from '../security/authenticate.js';
import MoviesPaths from '../security/MoviesPaths.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import asyncHandler from "express-async-handler";
import { reqLimiter } from '../middleware/reqLimiter.js';

const moviesRouter = express.Router();
moviesRouter.use(auth(MoviesPaths));

moviesRouter.get('/:id', validateParam(schemas.schemaId), reqLimiter, asyncHandler(async (req, res) => {
    const movie = await movieService.getMovieByID(req.params.id);
    res.send(movie).status(200);
}));

moviesRouter.post('/most-rated', validateBody(schemas.schemaMostRatedAndCommented), reqLimiter, asyncHandler(async (req, res) => {
    const { year, actor, genres, language, amount } = req.body;
    const movies = await movieService.getMostRatedMoviesByFilter({ year, actor, genres, language, amount });
    res.status(200).send(movies);
}));

moviesRouter.post('/most-commented', validateBody(schemas.schemaMostRatedAndCommented), reqLimiter, asyncHandler(async (req, res) => {
    const { year, actor, genres, language, amount } = req.body;
    const movies = await movieService.getMostCommentedMoviesByFilter({ year, actor, genres, language, amount });
    res.status(200).send(movies);
}));

moviesRouter.patch('/:imdb', validateBody(schemas.schemaUpdateMovieRating), rateLimiter, validateParam(schemas.schemaImdbId), asyncHandler(async (req, res) => {
    const { rating, email } = req.body;
    const imdb = parseInt(req.params.imdb);
    await movieService.updateMovieRating(imdb, rating, email);
    res.status(200).send({ message: 'Movie updated successfully' });
}));

export default moviesRouter;