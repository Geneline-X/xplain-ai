import {handleAuth} from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, {params}: any): Promise<void | Response> {
	const endpoint:string = params.kindeAuth;
	return handleAuth(request, endpoint) as Promise<void | Response>;
}