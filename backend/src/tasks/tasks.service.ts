import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const ALL_TASKS_KEY = 'tasks:all';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async findAll(): Promise<Task[]> {
    const cached = await this.cache.get<Task[]>(ALL_TASKS_KEY);
    if (cached) return cached;
    const tasks = await this.repo.find({ order: { createdAt: 'DESC' } });
    await this.cache.set(ALL_TASKS_KEY, tasks);
    return tasks;
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.repo.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.repo.create(dto);
    const saved = await this.repo.save(task);
    await this.cache.del(ALL_TASKS_KEY);
    return saved;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    const saved = await this.repo.save(task);
    await this.cache.del(ALL_TASKS_KEY);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.repo.remove(task);
    await this.cache.del(ALL_TASKS_KEY);
  }
}
