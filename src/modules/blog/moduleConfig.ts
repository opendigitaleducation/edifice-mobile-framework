import { createNavigableModuleConfig } from "~/framework/util/moduleTool";
import { IBlog_State } from "./reducer";
import theme from "~/app/theme";

export default createNavigableModuleConfig<"blog", IBlog_State>({
    name: "blog",
    displayName: "blog.tabName",
    picture: {type: 'Icon', name: 'bullhorn', color: theme.themeOpenEnt.indigo},
    matchEntcoreApp: "/blog",
    entcoreScope: ['blog'],
    registerAs: 'myAppsModule'
});
