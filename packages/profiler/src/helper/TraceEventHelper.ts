import { Session } from 'inspector'

export class TraceEventHelper {
	static post(session: Session, message: any, data: any) {
		return new Promise((resolve, reject) => {
			session.post(message, data, (err, result) => {
				if (err) {
					reject(new Error(JSON.stringify(err)))
				} else {
					resolve(result)
				}
			})
		})
	}
}