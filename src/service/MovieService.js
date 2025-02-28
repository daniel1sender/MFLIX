import accountService from "./AccountService.js";
import dotenv from "dotenv";
import MongoConnection from "../db/MongoConnection.js";
import { ObjectId } from "mongodb";

class MovieService {

    constructor(connection, collection) {
        this.connection = connection;
        this.collection = collection;
    }

    getMovieByID = async (id) => {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    getMoviesByImdbId = async (id) => {
        return await this.collection.find({ "imdb.id": id }).toArray();
    }

    async getMostRatedMoviesByFilter({ year, actor, genres, language, amount }) {
        const matchQuery = {
            ...(year && { year }),
            ...(actor && { actor: { $regex: actor, $options: "i" } }),
            ...(genres && { genres: { $all: genres } }),
            ...(language && { language }),
            "imdb.rating": { $ne: '' }
        };

        const filteredMovies = await this.collection.find(matchQuery)
            .sort({ "imdb.rating": -1 })
            .limit(amount)
            .project({ title: 1, imdb: 1, imdb_rating: 1 })
            .toArray();

        return filteredMovies;
    }

    async getMostCommentedMoviesByFilter({ year, actor, genres, language, amount }) {

        const matchQuery = {
            ...(year && { year }),
            ...(actor && { actor: { $regex: actor, $options: "i" } }),
            ...(genres && { genres: { $all: genres } }),
            ...(language && { language }),
        };

        const filteredMovies = await this.collection.find(matchQuery)
            .sort({ num_mflix_comments: -1 })
            .limit(amount)
            .project({ title: 1, imdb: 1, num_mflix_comments: 1 })
            .toArray();

        return filteredMovies;
    };

    updateMovieRating = async (imdbID, rating, email) => {
        const movies = await this.getMoviesByImdbId(imdbID);
        const newRating = ((movies[0].imdb.rating * movies[0].imdb.votes + rating) / (movies[0].imdb.votes + 1));

        await accountService.updateMoviesVoted(email, imdbID);

        const result = await this.collection.updateMany(
            { "imdb.id": imdbID },
            { $set: { "imdb.rating": newRating, "imdb.votes": movies[0].imdb.votes + 1 } }
        );

        return result.modifiedCount;
    };

}

dotenv.config();
const {
    CONNECTION_STRING,
    DB_NAME,
    COLLECTION_NAME_MOVIES
} = process.env;

const connection = new MongoConnection(CONNECTION_STRING, DB_NAME);
const movies = await connection.getCollection(COLLECTION_NAME_MOVIES);
const movieService = new MovieService(connection, movies);

export default movieService;