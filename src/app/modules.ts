/**
 * Every module is imported here.
 */

import { dynamiclyRegisterModules, loadModules, ModuleArray, AnyModule } from "~/framework/util/moduleTool"
import IncludedModules from "~/app/override/modules";

// We first imports all modules and their code hierarchy. Registrations are executed,
// and then, we call initModules to instanciate RootComponents for each module.
// The singleton pattern guarantee AllModules will be computed once.
let AllModules: ModuleArray<AnyModule> | undefined = undefined;

export default () => {
    if (AllModules) return AllModules;
    else {
        const moduleDeclarations = [
            // Built-il modules
            require("~/framework/modules/timelinev2"),

            // Included modules from override
            ...IncludedModules || []
        ];
        AllModules = dynamiclyRegisterModules(loadModules(moduleDeclarations).initModules());
        return AllModules;
    }
}
