import { LaboratoryModel } from '../../generated/prisma/models/Laboratory';
import { CreateLabResponseDto, PutLabResponseDto } from './dto/create-lab.dto';
import { DeleteLabResponseDto } from './dto/delete-lab.dto';

export function toLabResponse(lab: LaboratoryModel): CreateLabResponseDto {
  return {
    id: lab.id,
    clientId: lab.clientId,
    code: lab.code,
    name: lab.name,
    location: lab.location,
    timezone: lab.timezone,
    isActive: lab.isActive,
  };
}

export function toDeleteLabResponse(
  lab: LaboratoryModel,
  message: string,
): DeleteLabResponseDto {
  return {
    ...toLabResponse(lab),
    message,
  };
}

export function toPutLabResponse(
  lab: LaboratoryModel,
  action: PutLabResponseDto['action'],
): PutLabResponseDto {
  return {
    ...toLabResponse(lab),
    action,
  };
}
