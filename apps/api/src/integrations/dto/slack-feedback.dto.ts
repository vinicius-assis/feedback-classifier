import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SlackFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  text!: string;

  @IsString()
  @IsNotEmpty()
  externalMessageId!: string;
}
