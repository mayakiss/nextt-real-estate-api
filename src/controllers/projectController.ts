import { Request, Response } from 'express';
import { Project } from '../models/Project';

export const createProject = async (req: Request, res: Response) => {
  try {
    const project = new Project({
      ...req.body,
      owner: (req as any).user._id,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create project' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const { type, status, minPrice, maxPrice, search } = req.query;
    const query: any = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search as string };
    }

    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch projects' });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: (req as any).user._id,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    Object.assign(project, req.body);
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: (req as any).user._id,
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete project' });
  }
}; 