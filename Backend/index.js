
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(express.json());
app.use(cors());

const ai = new GoogleGenAI({ apiKey: process.env.AQ.Ab8RN6Ju4MkVN482yd6mIJ31CKO9nU3ugLSnjkM4AAW13A6Z7w });
