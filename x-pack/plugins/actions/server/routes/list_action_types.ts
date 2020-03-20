/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  IRouter,
  RequestHandlerContext,
  KibanaRequest,
  IKibanaResponse,
  KibanaResponseFactory,
} from 'kibana/server';
import { ILicenseState, verifyApiAccess } from '../lib';

export const listActionTypesRoute = (router: IRouter, licenseState: ILicenseState) => {
  router.get(
    {
      path: `/api/action/types`,
      validate: {},
      options: {
        tags: ['access:actions-read'],
      },
    },
    router.handleLegacyErrors(async function(
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      verifyApiAccess(licenseState);
      if (!context.actions) {
        return res.badRequest({ body: 'RouteHandlerContext is not registered for actions' });
      }
      return res.ok({
        body: context.actions.listTypes(),
      });
    })
  );
};
