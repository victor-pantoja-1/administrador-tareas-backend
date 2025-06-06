import { HttpException, HttpStatus } from "@nestjs/common";
import { HttpMessages } from "../enums/http-messages.enum";

export function compareDateRange(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  if (start && isNaN(start.getTime())) {
    throw new HttpException(
      HttpMessages.INVALID_DATE,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (end && isNaN(end.getTime())) {
    throw new HttpException(
      HttpMessages.INVALID_DATE,
      HttpStatus.BAD_REQUEST,
    );
  }

  if ((start && end) && (start > end)) {
    throw new HttpException(
      HttpMessages.INVALID_RANGE_DATES,
      HttpStatus.BAD_REQUEST,
    );
  }
}