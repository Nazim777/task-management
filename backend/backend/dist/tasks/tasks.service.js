"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const task_entity_1 = require("./task.entity");
const ALL_TASKS_KEY = 'tasks:all';
let TasksService = class TasksService {
    repo;
    cache;
    constructor(repo, cache) {
        this.repo = repo;
        this.cache = cache;
    }
    async findAll() {
        const cached = await this.cache.get(ALL_TASKS_KEY);
        if (cached)
            return cached;
        const tasks = await this.repo.find({ order: { createdAt: 'DESC' } });
        await this.cache.set(ALL_TASKS_KEY, tasks);
        return tasks;
    }
    async findOne(id) {
        const task = await this.repo.findOneBy({ id });
        if (!task)
            throw new common_1.NotFoundException(`Task ${id} not found`);
        return task;
    }
    async create(dto) {
        const task = this.repo.create(dto);
        const saved = await this.repo.save(task);
        await this.cache.del(ALL_TASKS_KEY);
        return saved;
    }
    async update(id, dto) {
        const task = await this.findOne(id);
        Object.assign(task, dto);
        const saved = await this.repo.save(task);
        await this.cache.del(ALL_TASKS_KEY);
        return saved;
    }
    async remove(id) {
        const task = await this.findOne(id);
        await this.repo.remove(task);
        await this.cache.del(ALL_TASKS_KEY);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], TasksService);
//# sourceMappingURL=tasks.service.js.map