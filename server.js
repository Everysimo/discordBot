exports.Server=class Server{
    constructor(id,command,gameroom,lottery,level,totalMember,totalOnline,iron,golden,obsidian,bronze,silver,diamond,emerald){
        this._id = id;
        this._command = command;
        this._gameroom= gameroom;
        this._lottery=lottery;
        this._level=level;
        this._totalMember=totalMember;
        this._totalOnline=totalOnline;
        this._iron=iron;
        this._golden=golden;
        this._obsidian=obsidian;
        this._bronze=bronze;
        this._silver=silver;
        this._diamond=diamond;
        this._emerald=emerald;
    }

    /*constructor(){
        this._id = "";
        this._command = "";
        this._gameroom= "";
        this._lottery="";
        this._level="";
        this._totalMember="";
        this._totalOnline="";
        this._iron="";
        this._golden="";
        this._obsidian="";
        this._bronze="";
        this._silver="";
        this._diamond="";
        this._emerald="";
    }*/
    
    /**
     * @param {string} val
     */
    set id (val) {
        this._id = val;
    }

    get id(){
        return this._id;
    }

    /**
     * @param {string} val
     */
    set command (val) {
        this._command = val;
    }

    get command(){
        return this._command;
    }

    /**
     * @param {string} val
     */
    set gameroom (val) {
        this._gameroom = val;
    }

    get gameroom(){
        return this._gameroom;
    }

    /**
     * @param {string} val
     */
    set lottery (val) {
        this._lottery = val;
    }
    
    get lottery(){
        return this._lottery;
    }

    /**
     * @param {string} val
     */
    set level (val) {
        this._level = val;
    }

    get level(){
        return this._level;
    }

    /**
     * @param {string} val
     */
    set totalMember (val) {
        this._totalMember = val;
    }

    get totalMember(){
        return this._totalMember;
    }

    /**
     * @param {string} val
     */
    set totalOnline (val) {
        this._totalOnline = val;
    }

    get totalOnline(){
        return this._totalOnline;
    }

    /**
     * @param {string} val
     */
    set iron (val) {
        this._iron = val;
    }

    get iron(){
        return this._iron;
    }

    /**
     * @param {string} val
     */
    set golden (val) {
        this._golden = val;
    }

    get golden(){
        return this._golden;
    }

    /**
     * @param {string} val
     */
    set obsidian (val) {
        this._obsidian = val;
    }

    get obsidian(){
        return this._obsidian;
    }

    /**
     * @param {string} val
     */
    set bronze (val) {
        this._bronze = val;
    }

    get bronze(){
        return this._bronze;
    }

    /**
     * @param {string} val
     */
    set silver (val) {
        this._silver = val;
    }

    get silver(){
        return this._silver;
    }

     /**
     * @param {string} val
     */
    set diamond (val) {
        this._diamond = val;
    }

    get diamond(){
        return this._diamond;
    }

     /**
     * @param {string} val
     */
    set emerald (val) {
        this._emerald = val;
    }

    get emerald(){
        return this._emerald;
    }
}