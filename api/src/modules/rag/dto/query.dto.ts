import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty({ message: 'Query is required' })
  @MinLength(1, { message: 'Query must be at least 1 character' })
  @MaxLength(5000, { message: 'Query must be less than 5000 characters' })
  query: string;
}
