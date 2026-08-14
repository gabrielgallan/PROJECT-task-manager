import { Module } from "@nestjs/common";
import { EmailSender } from "@/domain/identity/application/email/email-sender";
import { EnvModule } from "../env/env.module";
import { ResendEmailSender } from "./resend/resend-email-sender";

@Module({
    imports: [EnvModule],
    exports: [EmailSender],
    providers: [
        {
            provide: EmailSender,
            useClass: ResendEmailSender
        }
    ]
})
export class EmailModule { }