import { IsUrl, Matches, IsOptional, IsString } from 'class-validator';

export class RepositoryLinkDto {
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @Matches(
    /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/.*)?$/,
    { message: 'URL must be a valid GitHub repository URL' },
  )
  link?: string;

  @IsOptional()
  @IsString()
  branch?: string;
}
