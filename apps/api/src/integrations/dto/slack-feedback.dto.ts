import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SlackFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  text!: string;

  @IsString()
  @IsNotEmpty()
  externalMessageId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  userDisplayName?: string;
}
