// lib/server.ts
import app from "./app";
import express from "express";
import path from "path";
const SERVER_PORT = 5000;

app.listen(SERVER_PORT, () => {
    console.log('Express server listening on port ' + SERVER_PORT);
})

app.use(express.static(path.join(__dirname, '../public')))
