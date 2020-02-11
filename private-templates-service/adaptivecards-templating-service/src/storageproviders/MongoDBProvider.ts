import { StorageProvider } from "./IStorageProvider";
import { IUser, ITemplate, JSONResponse, ITemplateInstance } from "../models/models";
import { MongoUtils } from "../util/mongoutils/mongoutils";
import { MongoWorker } from "../util/mongoutils/MongoWorker";

const defaultConnectionOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  useFindAndModify: false
};
export class MongoDBProvider implements StorageProvider {
  worker: MongoWorker;

  constructor(connectionString: string, options: any = defaultConnectionOptions) {
    this.worker = new MongoWorker(connectionString, options);
  }

  // Construct functions are introduced to be able to search by
  // nested objects. For example, if team:["merlin", "morgana"] are
  // provided in the query, then we need to add operator $all
  // to make sure they're both in the returned user 'team' field
  private _constructUserQuery(query: Partial<IUser>): any {
    let userQuery: any = { ...query };
    if (query.team) {
      userQuery.team = { $all: query.team };
    }
    if (query.org) {
      userQuery.org = { $all: query.org };
    }
    return userQuery;
  }
  private _constructTemplateQuery(query: Partial<ITemplate>): any {
    let templateQuery: any = { ...query };
    if (query.tags) {
      templateQuery.tags = { $all: query.tags };
    }
    return templateQuery;
  }
  async getUsers(query: Partial<IUser>): Promise<JSONResponse<IUser[]>> {
    let userQuery: any = this._constructUserQuery(query);
    return await this.worker.User.find(userQuery)
      .then(users => {
        if (users.length) {
          return Promise.resolve({
            success: true,
            result: users
          });
        }
        return Promise.resolve({
          success: false,
          result: [],
          errorMessage: "No users found matching given criteria"
        });
      })
      .catch(e => {
        return Promise.resolve({ success: false, errorMessage: e });
      });
  }
  async getTemplates(query: Partial<ITemplate>): Promise<JSONResponse<ITemplate[]>> {
    let templateQuery: any = this._constructTemplateQuery(query);
    return await this.worker.Template.find(templateQuery)
      .then(templates => {
        if (templates.length) {
          return Promise.resolve({
            success: true,
            result: templates
          });
        }
        return Promise.resolve({
          success: false,
          result: [],
          errorMessage: "No templates found matching given criteria"
        });
      })
      .catch(e => {
        return Promise.resolve({ success: false, errorMessage: e });
      });
  }
  // Updates Only one user
  async updateUser(query: Partial<IUser>, updateQuery: Partial<IUser>): Promise<JSONResponse<Number>> {
    let userQuery: any = this._constructUserQuery(query);
    return await this.worker.User.findOneAndUpdate(userQuery, updateQuery)
      .then(result => {
        if (result) {
          return Promise.resolve({
            success: true
          });
        }
        return Promise.resolve({
          success: false,
          errorMessage: "No users found matching given criteria."
        });
      })
      .catch(e => {
        return Promise.resolve({
          success: false,
          errorMessage: e
        });
      });
  }
  async updateTemplate(query: Partial<ITemplate>, updateQuery: Partial<ITemplate>): Promise<JSONResponse<Number>> {
    let templateQuery: any = this._constructTemplateQuery(query);
    return await this.worker.Template.findOneAndUpdate(templateQuery, updateQuery)
      .then(result => {
        if (result) {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({
          success: false,
          errorMessage: "No templates found matching given criteria."
        });
      })
      .catch(e => {
        return Promise.resolve({
          success: false,
          errorMessage: e
        });
      });
  }
  async insertUser(user: IUser): Promise<JSONResponse<Number>> {
    return await this.worker.User.create(user)
      .then(result => {
        return Promise.resolve({ success: true, result: 1 });
      })
      .catch(e => {
        return Promise.resolve({
          success: false,
          errorMessage: e
        });
      });
  }
  async insertTemplate(template: ITemplate): Promise<JSONResponse<Number>> {
    return await this.worker.Template.create(template)
      .then(result => {
        return Promise.resolve({ success: true, result: 1 });
      })
      .catch(e => {
        return Promise.resolve({
          success: false,
          errorMessage: e
        });
      });
  }
  async removeUser(query: Partial<IUser>): Promise<JSONResponse<Number>> {
    return await this.worker.User.deleteOne(query)
      .then(result => {
        if (result.deletedCount) {
          return Promise.resolve({
            success: true
          });
        }
        return Promise.resolve({
          success: false,
          errorMessage: "No users found matching given criteria"
        });
      })
      .catch(e => {
        return Promise.resolve({
          success: false,
          errorMessage: e
        });
      });
  }
  async removeTemplate(query: Partial<ITemplate>): Promise<JSONResponse<Number>> {
    return await this.worker.Template.deleteOne(query)
      .then(result => {
        if (result.deletedCount) {
          return Promise.resolve({
            success: true
          });
        }
        return Promise.resolve({
          success: false,
          errorMessage: "No templates found matching given criteria"
        });
      })
      .catch(e => {
        return Promise.resolve({
          success: false,
          errorMessage: e
        });
      });
  }

  async connect(): Promise<JSONResponse<Boolean>> {
    return await this.worker.connect();
  }

  async close(): Promise<JSONResponse<Boolean>> {
    return await this.worker.close();
  }
}
