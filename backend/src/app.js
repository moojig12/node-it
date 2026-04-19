import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import healthRouter from './routes/health.js';
import categoriesRouter from './routes/categories.js';
import nodesRouter from './routes/nodes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/health', healthRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/nodes', nodesRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
