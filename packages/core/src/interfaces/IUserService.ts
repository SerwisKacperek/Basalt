import type { ApiClient } from "@basalt/api";

type UserApi = ApiClient["api"]["users"];
type UserItemApi = ReturnType<UserApi>;

export interface IUserService {
  register(body: { email: string; password: string }): ReturnType<UserApi["register"]["post"]>;
  getAll(): ReturnType<UserApi["get"]>;
  getById(id: string): ReturnType<UserItemApi["get"]>;
  update(id: string, body: { email?: string }): ReturnType<UserItemApi["patch"]>;
  remove(id: string): ReturnType<UserItemApi["delete"]>;
}
