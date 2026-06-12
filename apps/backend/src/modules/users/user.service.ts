import { UserService as DomainUserService, ConflictException } from '@basalt/domain';
import type { UserRepository } from '@basalt/domain';
import type { Select } from '@basalt/domain';

export class UserService extends DomainUserService {
  constructor(repository: UserRepository) {
    super(repository);
  }

  async register(email: string, password: string): Promise<Select<'users'>> {
    const existing = await this.repository.findByEmail(email);
    if (existing) throw new ConflictException(`Email '${email}' already in use`);
    const hashed = await Bun.password.hash(password);
    return this.repository.create({ email, password: hashed });
  }
}
