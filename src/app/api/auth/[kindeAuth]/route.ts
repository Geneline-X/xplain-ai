import {handleAuth} from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";

type KindeAuthParams = {
	params: {
		kindeAuth: string
	}
}
export const GET = handleAuth();