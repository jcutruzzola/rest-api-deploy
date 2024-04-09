const express = require ("express")
const crypto = require("node:crypto")
const movies = require("./movies.json")
const cors = require("cors")
const { validateMovie, validatePartialMovie } = require("./schemas/movies.js")

const app = express()
app.use(express.json())

// app.use(cors()) // Este MIDDLEWARE va a poner los origin ports con *, es decir que acepta todo. Es decir, soluciona el problema pero no de manera específica.

// En caso de que quiera personalizar los origins seria de la siguiente manera.

app.use(cors( {
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            "http://localhost:8080",
            "http://localhost:1234",
            "http://localhost:60949",
            "http://movies.com",
        ]
    
        if(ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error("Not allowed by CORS"))
    }
}))



app.disable("x-powered-by")

app.get ("/", (req, res) => {
    res.json( {message: "Hola mundo"} )
})


app.get("/movies", (req, res) => {
    const origin = req.header("origin")
    const { genre } = req.query
    if(genre) {
        const filteredMovies = movies.filter(
                movie => movie.genre.some( g => g.toLowerCase() === genre.toLowerCase())
            )
     return res.json(filteredMovies)
    }
    res.json(movies);
})


app.get("/movies/:id", (req, res) => {
    const { id } = req.params
    const movie = movies.find(movie => movie.id === id)
    if (movie) return res.json(movie)

    res.status(404).json( {message: "Movie not found"} )

})


app.post("/movies", (req, res) => {

    // ENUMS
    const result = validateMovie(req.body)

    if (result.error) {
        return res.status(400).json( { error: JSON.parse(result.error.message) } )    
    
    }

        const newMovie = {
            id: crypto.randomUUID(),
            ...result.data
        
        }
    
    movies.push(newMovie)

    res.status(201).json(newMovie) // actualizar la cache del cliente

})

app.delete("/movies/:id", (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: "Movie not Found"})    
    }

    movies.splice(movieIndex, 1)

    return res.json({ message: "Movie Deleted"})
})


app.patch("/movies/:id", (req, res)=> {
    
    const result = validatePartialMovie(req.body)
    if(!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const movieIndex = movies.findIndex( movie => movie.id === id )

    if(movieIndex === -1) {
        return res.status(404).json( {message:"Movie not found"} )
    } 
 
    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }
    
    movies[movieIndex] = updateMovie

    return res.json(updateMovie)


})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, ()=> {
    console.log(`Server listening on port http://localhost:${PORT} `);

})

