import { Router, Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import {
  check,
  query,
  param,
} from 'express-validator';
import asyncMiddleware from 'api/middleware/asyncMiddleware';
import BaseController from 'api/controllers/BaseController';
import UsersService from 'services/Users/UsersService';
import { ServiceError, ServiceErrors } from 'exceptions';
import { ISystemUserDTO } from 'interfaces';

@Service()
export default class UsersController extends BaseController{
  @Inject()
  usersService: UsersService;

  /**
   * Router constructor.
   */
  router() {
    const router = Router();

    router.put('/:id/inactivate', [
        ...this.specificUserSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.inactivateUser.bind(this))
    );
    router.put('/:id/activate', [
        ...this.specificUserSchema
      ],
      this.validationResult,
      asyncMiddleware(this.activateUser.bind(this))
    );
    router.post('/:id', [
        ...this.userDTOSchema,
        ...this.specificUserSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.editUser.bind(this))
    );
    router.get('/',
      this.listUsersSchema,
      this.validationResult,
      asyncMiddleware(this.listUsers.bind(this))
    );
    router.get('/:id', [
        ...this.specificUserSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.getUser.bind(this))
    );
    router.delete('/:id', [
        ...this.specificUserSchema
      ],
      this.validationResult,
      asyncMiddleware(this.deleteUser.bind(this))
    );
    return router;
  }

  /**
   * User DTO Schema.
   */
  get userDTOSchema() {
    return [
      check('first_name').exists(),
      check('last_name').exists(),
      check('email').exists().isEmail(),
      check('phone_number').optional().isMobilePhone(),
    ]
  }

  get specificUserSchema() {
    return [
      param('id').exists().isNumeric().toInt(),
    ];
  }

  get listUsersSchema() {
    return [
      query('page_size').optional().isNumeric().toInt(),
      query('page').optional().isNumeric().toInt(),
    ];
  }
 
  /**
   * Edit details of the given user.
   * @param {Request} req 
   * @param {Response} res 
   * @return {Response|void}
   */
  async editUser(req: Request, res: Response, next: NextFunction) {
    const userDTO: ISystemUserDTO = this.matchedBodyData(req);
    const { tenantId } = req;
    const { id: userId } = req.params;

    try {
      await this.usersService.editUser(tenantId, userId, userDTO);
      return res.status(200).send({ id: userId });
    } catch (error) {
      if (error instanceof ServiceErrors) {
        const errorReasons = [];
        
        if (error.errorType === 'email_already_exists') {
          errorReasons.push({ type: 'EMAIL_ALREADY_EXIST', code: 100 });
        }
        if (error.errorType === 'phone_number_already_exist') {
          errorReasons.push({ type: 'PHONE_NUMBER_ALREADY_EXIST', code: 200 });
        }
        if (errorReasons.length > 0) {
          return res.status(400).send({ errors: errorReasons });
        }
      }
      next(error);
    }
  }

  /**
   * Soft deleting the given user.
   * @param {Request} req 
   * @param {Response} res 
   * @return {Response|void}
   */
  async deleteUser(req: Request, res: Response, next: Function) {
    const { id } = req.params;
    const { tenantId } = req;

    debugger;

    try {
      await this.usersService.deleteUser(tenantId, id);
      return res.status(200).send({ id });
    } catch (error) {
      if (error instanceof ServiceError) {
        if (error.errorType === 'user_not_found') {
          return res.boom.notFound(null, {
            errors: [{ type: 'USER_NOT_FOUND', code: 100 }],
          });  
        }
      }
      next(error);
    }
  }

  /**
   * Retrieve user details of the given user id.
   * @param {Request} req 
   * @param {Response} res 
   * @return {Response|void}
   */
  async getUser(req: Request, res: Response, next: NextFunction) {
    const { id: userId } = req.params;
    const { tenantId } = req;
      
    try {
      const user = await this.usersService.getUser(tenantId, userId);
      return res.status(200).send({ user });
    } catch (error) {
      if (error instanceof ServiceError) {
        if (error.errorType === 'user_not_found') {
          return res.boom.notFound(null, {
            errors: [{ type: 'USER_NOT_FOUND', code: 100 }],
          });
        }
      }
      next(error);
    } 
  }

  /**
   * Retrieve the list of users.
   * @param {Request} req 
   * @param {Response} res 
   * @return {Response|void}
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    try {
      const users = await this.usersService.getList(tenantId);

      return res.status(200).send({ users });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate the given user.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async activateUser(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    const { id: userId } = req.params;

    try {
      await this.usersService.activateUser(tenantId, userId);
      return res.status(200).send({ id: userId });
    } catch(error) {
      if (error instanceof ServiceError) {
        if (error.errorType === 'user_not_found') {
          return res.status(404).send({
            errors: [{ type: 'USER.NOT.FOUND', code: 100 }],
          });
        }
        if (error.errorType === 'user_already_active') {
          return res.status(404).send({
            errors: [{ type: 'USER.ALREADY.ACTIVE', code: 200 }],
          });
        }
      }
      next(error);
    }
  }

  /**
   * Inactivate the given user.
   * @param {Request} req 
   * @param {Response} res 
   * @return {Response|void}
   */
  async inactivateUser(req: Request, res: Response, next: NextFunction) {
    const { tenantId, user } = req;
    const { id: userId } = req.params;

    try {
      await this.usersService.inactivateUser(tenantId, userId);
      return res.status(200).send({ id: userId });
    } catch(error) {
      if (error instanceof ServiceError) {
        if (error.errorType === 'user_not_found') {
          return res.status(404).send({
            errors: [{ type: 'USER.NOT.FOUND', code: 100 }],
          });
        }
        if (error.errorType === 'user_already_inactive') {
          return res.status(404).send({
            errors: [{ type: 'USER.ALREADY.INACTIVE', code: 200 }],
          });
        }
      }
      next(error);
    }
  }
};