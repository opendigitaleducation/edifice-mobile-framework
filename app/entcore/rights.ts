import { appPrefix, Behaviours, model } from "./entcore"

export interface Shareable {
	shared: any
	owner: { userId: string; displayName: string }
	myRights: any
}

const waitingFor = {}

export class Rights<T extends Shareable> {
	constructor(private resource: T) {
		this.myRights = {}
	}

	public myRights: any

	public isOwner() {
		return this.resource.owner.userId === model.me.userId
	}

	public fromBehaviours(prefix?: string): Promise<any> {
		if (!prefix) {
			prefix = appPrefix
		}

		return new Promise((resolve, reject) => {
			if (Behaviours.applicationsBehaviours[prefix] && !Behaviours.applicationsBehaviours[prefix].callbacks) {
				this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix).then(result => {
					resolve(result)
				})
			} else {
				if (waitingFor[prefix]) {
					waitingFor[prefix].push(() => resolve(this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix)))
				} else {
					waitingFor[prefix] = []
					Behaviours.loadBehaviours(prefix, () => {
						this.fromObject(Behaviours.applicationsBehaviours[prefix].rights, prefix).then(result => {
							resolve(result)
							waitingFor[prefix].forEach(f => f())
							delete waitingFor[prefix]
						})
					})
				}
			}
		})
	}

	public async fromObject(obj: any, prefix: string): Promise<any> {
		return new Promise((resolve, reject) => {
			const resourceRights = obj.resource

			const computeRights = () => {
				for (var behaviour in resourceRights) {
					if (
						model.me &&
						(model.me.hasRight(this.resource, resourceRights[behaviour]) ||
							(this.resource.owner && model.me.userId === this.resource.owner.userId))
					) {
						this.myRights[behaviour] = true
					}
				}
			}

			if (model.me) {
				computeRights()
				resolve()
				return
			}

			if (model.bootstrapped && !model.me) {
				resolve()
				return
			}

			model.one("bootstrap", () => {
				computeRights()
				resolve()
			})
		})
	}
}

if (!(window as any).entcore) {
	;(window as any).entcore = {}
}
;(window as any).entcore.Rights = Rights
