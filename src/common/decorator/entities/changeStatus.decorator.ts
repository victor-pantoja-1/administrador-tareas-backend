import { SetMetadata } from '@nestjs/common';
import { StateChangeProperties } from 'src/common/helpers/changeStatusEntities';

export const ChangeStatusOfEntity = () => (target: any, propertyKey: string) => {
  const entityName = target.constructor.name;
  SetMetadata('changeStatusOfEntityForAfterUpdate', true)(target, propertyKey, undefined);

  if (!StateChangeProperties.mapEntities.has(entityName)) {
    StateChangeProperties.mapEntities.set(entityName, []);
  }

  StateChangeProperties.mapEntities.get(entityName)!.push(propertyKey);
};