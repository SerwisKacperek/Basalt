import type { Select, Insert } from '../../schema/types';
import type { IService } from '../../shared/interfaces/service.base';
import type { UserRepository } from "./user.repository";
import type { Filters } from '../../shared/utils';
import { NotFoundException, ConflictException } from '../../shared/errors';

export class UserService implements IService<'users'> {
  constructor(private repository: UserRepository) { }

  async findById(
    id: string
  ): Promise<Select<'users'>> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User', id);
    return user;
  }

  findAll(
    filters?: Filters<Select<'users'>>
  ): Promise<Select<'users'>[]> {
    return this.repository.findAll(filters);
  }

  create(
    dto: Insert<'users'>
  ): Promise<Select<'users'>> {
    return this.repository.create(dto);
  }

  async register(email: string, password: string): Promise<Select<'users'>> {
    const existing = await this.repository.findByEmail(email);
    if (existing) throw new ConflictException(`Email '${email}' already in use`);

    const hashed = await Bun.password.hash(password);
    return this.repository.create({ email, password: hashed });
  }

  async update(
    id: string,
    dto: Partial<Insert<'users'>>
  ): Promise<Select<'users'>> {
    const user = await this.repository.update(id, dto);
    if (!user) throw new NotFoundException('User', id);
    return user;
  }

  async delete(
    id: string
  ): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundException('User', id);
  }
}