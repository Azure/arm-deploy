**Debugging the ARM action in local machine**

Open PowerShell, go to the directory where the repo is stored (.../arm-deploy/) and execute the following commands.

**1.npm install** \
npm install downloads dependencies defined in a package. json file and generates a node_modules folder with the installed modules. \
**2.npm install -g @vercel/ncc** \
**3.ncc build src/entrypoint.ts -s -o _build**  \
ncc is a simple CLI for compiling a Node.js module into a single file, together with all its dependencies, gcc-style. \
**4. az login** \
This will open the browser, where you can do the Azure login which gives you proper access required for the action. 

Open the arm-deploy repository in VSCode, attach debugging points at required places _(flow begins from entrypoint.ts)_ and press F5. The debugger gets attached.

Also, for various input values required while testing, you can specify those as environment variables in launch.json that gets created. \
_Happy debugging!_
