exports.Server=class Server{
    constructor(id,command,gameroom,lottery,level,totalMember,totalOnline,iron,golden,obsidian,bronze,silver,diamond,emerald){
        this.id = id;
        this.command = command;
        this.gameroom= gameroom;
        this.lottery=lottery;
        this.level=level;
        this.totalMember=totalMember;
        this.totalOnline=totalOnline;
        this.iron=iron;
        this.golden=golden;
        this.obsidian=obsidian;
        this.bronze=bronze;
        this.silver=silver;
        this.diamond=diamond;
        this.emerald=emerald;
    }
    
    /**
     * @param {string} val
     */
    set id (val) {
        this.id = val;
    }

    get id(){
        return this.id;
    }

    /**
     * @param {string} val
     */
    set command (val) {
        this.command = val;
    }

    get command(){
        return this.command;
    }

    /**
     * @param {string} val
     */
    set gameroom (val) {
        this.gameroom = val;
    }

    get gameroom(){
        return this.gameroom;
    }

    /**
     * @param {string} val
     */
    set lottery (val) {
        this.lottery = val;
    }
    
    get lottery(){
        return this.lottery;
    }

    /**
     * @param {string} val
     */
    set level (val) {
        this.level = val;
    }

    get level(){
        return this.level;
    }

    /**
     * @param {string} val
     */
    set totalMember (val) {
        this.totalMember = val;
    }

    get totalMember(){
        return this.totalMember;
    }

    /**
     * @param {string} val
     */
    set totalOnline (val) {
        this.totalOnline = val;
    }

    get totalOnline(){
        return this.totalOnline;
    }

    /**
     * @param {string} val
     */
    set iron (val) {
        this.iron = val;
    }

    get iron(){
        return this.iron;
    }

    /**
     * @param {string} val
     */
    set golden (val) {
        this.golden = val;
    }

    get golden(){
        return this.golden;
    }

    /**
     * @param {string} val
     */
    set obsidian (val) {
        this.obsidian = val;
    }

    get obsidian(){
        return this.obsidian;
    }

    /**
     * @param {string} val
     */
    set bronze (val) {
        this.bronze = val;
    }

    get bronze(){
        return this.bronze;
    }

    /**
     * @param {string} val
     */
    set silver (val) {
        this.silver = val;
    }

    get silver(){
        return this.silver;
    }

     /**
     * @param {string} val
     */
    set diamond (val) {
        this.diamond = val;
    }

    get diamond(){
        return this.diamond;
    }

     /**
     * @param {string} val
     */
    set emerald (val) {
        this.emerald = val;
    }

    get emerald(){
        return this.emerald;
    }
}