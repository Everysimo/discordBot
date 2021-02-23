exports.Server=new class {
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
}